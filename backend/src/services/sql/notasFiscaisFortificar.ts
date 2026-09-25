// Notas fiscais das contas do Fortificar (2200101001 e 2200101002) emitidas a partir de 2026.
// Produz o mesmo resultado da view FortesStaging.dbo.vw_notas_fiscais, que leva mais de 15 minutos.
// As tabelas mega.* do staging nao tem indices: por isso o lote parte dos poucos lancamentos das
// contas do Fortificar e materializa cada etapa em tabela temporaria, o que impede o otimizador de
// reavaliar as etapas com varreduras repetidas. Roda em cerca de 30 segundos.
export const NOTAS_FISCAIS_FORTIFICAR_SQL = `
set nocount on;
select * into #classesFortificar from (
        select cla_tab_in_codigo, cla_pad_in_codigo, cla_ide_st_codigo, cla_in_reduzido, cla_st_extenso
        from mega.fin_classe
        where cla_st_extenso in ('2200101001', '2200101002')
) q;
select * into #rateio from (
        select
            lac.org_tab_in_codigo, lac.org_pad_in_codigo, lac.org_in_codigo, lac.org_tau_st_codigo,
            lac.mov_tab_in_codigo, lac.mov_seq_in_codigo, lac.mov_in_numlancto,
            lac.lcl_re_percentual,
            lap.lpr_re_percentual,
            lap.lpr_re_valor,
            cla.cla_st_extenso,
            cla.cla_in_reduzido,
            pro.pro_st_apelido
        from mega.fin_lancclasse lac
        inner join #classesFortificar cla
            on  lac.cla_tab_in_codigo = cla.cla_tab_in_codigo
            and lac.cla_pad_in_codigo = cla.cla_pad_in_codigo
            and lac.cla_ide_st_codigo = cla.cla_ide_st_codigo
            and lac.cla_in_reduzido   = cla.cla_in_reduzido
        inner join mega.fin_lancccusto lcc
            on  lcc.org_tab_in_codigo = lac.org_tab_in_codigo
            and lcc.org_pad_in_codigo = lac.org_pad_in_codigo
            and lcc.org_in_codigo     = lac.org_in_codigo
            and lcc.org_tau_st_codigo = lac.org_tau_st_codigo
            and lcc.mov_tab_in_codigo = lac.mov_tab_in_codigo
            and lcc.mov_seq_in_codigo = lac.mov_seq_in_codigo
            and lcc.mov_in_numlancto  = lac.mov_in_numlancto
            and lcc.cla_tab_in_codigo = lac.cla_tab_in_codigo
            and lcc.cla_pad_in_codigo = lac.cla_pad_in_codigo
            and lcc.cla_ide_st_codigo = lac.cla_ide_st_codigo
            and lcc.cla_in_reduzido   = lac.cla_in_reduzido
            and lcc.lcl_ch_natureza   = lac.lcl_ch_natureza
        inner join mega.fin_lancproj lap
            on  lap.org_tab_in_codigo = lcc.org_tab_in_codigo
            and lap.org_pad_in_codigo = lcc.org_pad_in_codigo
            and lap.org_in_codigo     = lcc.org_in_codigo
            and lap.org_tau_st_codigo = lcc.org_tau_st_codigo
            and lap.mov_tab_in_codigo = lcc.mov_tab_in_codigo
            and lap.mov_seq_in_codigo = lcc.mov_seq_in_codigo
            and lap.mov_in_numlancto  = lcc.mov_in_numlancto
            and lap.cla_tab_in_codigo = lcc.cla_tab_in_codigo
            and lap.cla_pad_in_codigo = lcc.cla_pad_in_codigo
            and lap.cla_ide_st_codigo = lcc.cla_ide_st_codigo
            and lap.cla_in_reduzido   = lcc.cla_in_reduzido
            and lap.lcl_ch_natureza   = lcc.lcl_ch_natureza
            and lap.lcc_in_numero     = lcc.lcc_in_numero
        inner join mega.glo_projetos pro
            on  lap.pro_tab_in_codigo = pro.pro_tab_in_codigo
            and lap.pro_pad_in_codigo = pro.pro_pad_in_codigo
            and lap.pro_ide_st_codigo = pro.pro_ide_st_codigo
            and lap.pro_in_reduzido   = pro.pro_in_reduzido
) q;
select * into #origens from (
        select distinct
            org_tab_in_codigo, org_pad_in_codigo, org_in_codigo, org_tau_st_codigo,
            mov_tab_in_codigo, mov_seq_in_codigo, mov_in_numlancto
        from #rateio
) q;
select * into #baixas from (
        select
            bx.org_tab_in_codigo  as bxorg_tab_in_codigo,
            bx.org_pad_in_codigo  as bxorg_pad_in_codigo,
            bx.org_in_codigo      as bxorg_in_codigo,
            bx.org_tau_st_codigo  as bxorg_tau_st_codigo,
            bx.mov_tab_in_codigo  as bxmov_tab_in_codigo,
            bx.mov_seq_in_codigo  as bxmov_seq_in_codigo,
            bx.mov_in_numlancto   as bxmov_in_numlancto,
            bx.mov_dt_datadocto   as bxmov_dt_datadocto,
            bx.mov_re_valordeb    as bxmov_re_valordeb,
            bx.mov_re_valorcre    as bxmov_re_valorcre,
            bx.mov_in_numlanctoestorno as bxmov_in_numlanctoestorno,
            case
                when bx.tref_st_codigo in ('BXCPA', 'BAIXAADI') and ref.ref_st_tipo in ('BXCPA', 'BAIXAADI') then 1
                else 0
            end as ehCpa,
            case
                when bx.tref_st_codigo in ('BXCRE', 'BXDESCD', 'BAIXAADI') and ref.ref_st_tipo in ('BXCRE', 'BXDESCD', 'BAIXAADI') then 1
                else 0
            end as ehCre,
            o.org_tab_in_codigo, o.org_pad_in_codigo, o.org_in_codigo, o.org_tau_st_codigo,
            o.mov_tab_in_codigo, o.mov_seq_in_codigo, o.mov_in_numlancto
        from #origens o
        inner join mega.fin_referenciafin ref
            on  ref.ref_org_tab_in_codigo = o.org_tab_in_codigo
            and ref.ref_org_pad_in_codigo = o.org_pad_in_codigo
            and ref.ref_org_in_codigo     = o.org_in_codigo
            and ref.ref_org_tau_st_codigo = o.org_tau_st_codigo
            and ref.ref_mov_tab_in_codigo = o.mov_tab_in_codigo
            and ref.ref_mov_seq_in_codigo = o.mov_seq_in_codigo
            and ref.ref_mov_in_numlancto  = o.mov_in_numlancto
            and ref.ref_st_tipo in ('BXCPA', 'BXCRE', 'BXDESCD', 'BAIXAADI')
        inner join mega.fin_movimento bx
            on  bx.org_tab_in_codigo = ref.org_tab_in_codigo
            and bx.org_pad_in_codigo = ref.org_pad_in_codigo
            and bx.org_in_codigo     = ref.org_in_codigo
            and bx.org_tau_st_codigo = ref.org_tau_st_codigo
            and bx.mov_tab_in_codigo = ref.mov_tab_in_codigo
            and bx.mov_seq_in_codigo = ref.mov_seq_in_codigo
            and bx.mov_in_numlancto  = ref.mov_in_numlancto
            and bx.tref_st_codigo in ('BXCPA', 'BXCRE', 'BXDESCD', 'BAIXAADI')
) q;
select * into #tipoDocBaixa from (
        select *
        from (
            select
                ref2.org_tab_in_codigo, ref2.org_pad_in_codigo, ref2.org_in_codigo, ref2.org_tau_st_codigo,
                ref2.mov_tab_in_codigo, ref2.mov_seq_in_codigo, ref2.mov_in_numlancto,
                case when ref2.ref_st_tipo in ('BXFINCPA', 'BAIXAADI') then 1 else 0 end as ehCpa,
                case when ref2.ref_st_tipo in ('BXFINCRE', 'BXDESCD', 'BAIXAADI') then 1 else 0 end as ehCre,
                finmov.tpd_st_codigo,
                finmov.mov_in_numlancto as finmov_in_numlancto
            from (select distinct
                      bxorg_tab_in_codigo, bxorg_pad_in_codigo, bxorg_in_codigo, bxorg_tau_st_codigo,
                      bxmov_tab_in_codigo, bxmov_seq_in_codigo, bxmov_in_numlancto
                  from #baixas) b
            inner join mega.fin_referenciafin ref2
                on  ref2.org_tab_in_codigo = b.bxorg_tab_in_codigo
                and ref2.org_pad_in_codigo = b.bxorg_pad_in_codigo
                and ref2.org_in_codigo     = b.bxorg_in_codigo
                and ref2.org_tau_st_codigo = b.bxorg_tau_st_codigo
                and ref2.mov_tab_in_codigo = b.bxmov_tab_in_codigo
                and ref2.mov_seq_in_codigo = b.bxmov_seq_in_codigo
                and ref2.mov_in_numlancto  = b.bxmov_in_numlancto
                and ref2.ref_st_tipo in ('BXFINCPA', 'BXFINCRE', 'BXDESCD', 'BAIXAADI')
            inner join mega.fin_movimento finmov
                on  finmov.org_tab_in_codigo = ref2.ref_org_tab_in_codigo
                and finmov.org_pad_in_codigo = ref2.ref_org_pad_in_codigo
                and finmov.org_in_codigo     = ref2.ref_org_in_codigo
                and finmov.org_tau_st_codigo = ref2.ref_org_tau_st_codigo
                and finmov.mov_tab_in_codigo = ref2.ref_mov_tab_in_codigo
                and finmov.mov_seq_in_codigo = ref2.ref_mov_seq_in_codigo
                and finmov.mov_in_numlancto  = ref2.ref_mov_in_numlancto
        ) x
) q;
select * into #tipoDocBaixaCpa from (
        select *, row_number() over (
            partition by org_tab_in_codigo, org_pad_in_codigo, org_in_codigo, org_tau_st_codigo,
                         mov_tab_in_codigo, mov_seq_in_codigo, mov_in_numlancto
            order by finmov_in_numlancto) as rn
        from #tipoDocBaixa
        where ehCpa = 1
) q;
select * into #tipoDocBaixaCre from (
        select *, row_number() over (
            partition by org_tab_in_codigo, org_pad_in_codigo, org_in_codigo, org_tau_st_codigo,
                         mov_tab_in_codigo, mov_seq_in_codigo, mov_in_numlancto
            order by finmov_in_numlancto) as rn
        from #tipoDocBaixa
        where ehCre = 1
) q;
select * into #baixasCpa from (
        select b.*, t.tpd_st_codigo as fintpd_st_codigo
        from #baixas b
        left join #tipoDocBaixaCpa t
            on  t.rn = 1
            and t.org_tab_in_codigo = b.bxorg_tab_in_codigo
            and t.org_pad_in_codigo = b.bxorg_pad_in_codigo
            and t.org_in_codigo     = b.bxorg_in_codigo
            and t.org_tau_st_codigo = b.bxorg_tau_st_codigo
            and t.mov_tab_in_codigo = b.bxmov_tab_in_codigo
            and t.mov_seq_in_codigo = b.bxmov_seq_in_codigo
            and t.mov_in_numlancto  = b.bxmov_in_numlancto
        where b.ehCpa = 1
) q;
select * into #baixasCre from (
        select b.*, t.tpd_st_codigo as fintpd_st_codigo
        from #baixas b
        left join #tipoDocBaixaCre t
            on  t.rn = 1
            and t.org_tab_in_codigo = b.bxorg_tab_in_codigo
            and t.org_pad_in_codigo = b.bxorg_pad_in_codigo
            and t.org_in_codigo     = b.bxorg_in_codigo
            and t.org_tau_st_codigo = b.bxorg_tau_st_codigo
            and t.mov_tab_in_codigo = b.bxmov_tab_in_codigo
            and t.mov_seq_in_codigo = b.bxmov_seq_in_codigo
            and t.mov_in_numlancto  = b.bxmov_in_numlancto
        where b.ehCre = 1
) q;
select * into #faturaPagar from (
        select
            'REFERENCIA'            as tipo,
            ref.ref_st_numeronf,
            ref.ref_tpd_st_codigo   as fpa_tpd_st_codigo,
            ref.ref_dt_emissaonf    as data_emissao,
            ref.ref_re_valornf,
            ref.org_tab_in_codigo, ref.org_pad_in_codigo, ref.org_in_codigo, ref.org_tau_st_codigo,
            ref.agn_tab_in_codigo, ref.agn_pad_in_codigo, ref.agn_in_codigo, ref.agn_tau_st_codigo,
            ref.ser_tab_in_codigo, ref.ser_st_codigo, ref.ser_in_sequencia,
            ref.fpa_in_numero, ref.fpa_in_contador,
            ref.fpa_tpd_st_codigo   as fpa_tpd_st_codigo_join
        from mega.fin_baixarefcpa ref

        union all

        select
            'AP'                    as tipo,
            fat.rcb_st_nota         as ref_st_numeronf,
            fat.fpa_tpd_st_codigo   as fpa_tpd_st_codigo,
            fat.fpa_dt_emissao      as data_emissao,
            fat.fpa_re_valor        as ref_re_valornf,
            fat.org_tab_in_codigo, fat.org_pad_in_codigo, fat.org_in_codigo, fat.org_tau_st_codigo,
            fat.agn_tab_in_codigo, fat.agn_pad_in_codigo, fat.agn_in_codigo, fat.agn_tau_st_codigo,
            fat.ser_tab_in_codigo, fat.ser_st_codigo, fat.ser_in_sequencia,
            fat.fpa_in_numero, fat.fpa_in_contador,
            fat.fpa_tpd_st_codigo   as fpa_tpd_st_codigo_join
        from mega.fin_faturapagar fat
        where fat.fpa_dt_emissao >= '2026-01-01'
          and not exists (
            select 1
            from mega.fin_baixarefcpa ref
            where ref.fpa_in_numero     = fat.fpa_in_numero
              and ref.org_tab_in_codigo = fat.org_tab_in_codigo
              and ref.org_pad_in_codigo = fat.org_pad_in_codigo
              and ref.org_in_codigo     = fat.org_in_codigo
              and ref.org_tau_st_codigo = fat.org_tau_st_codigo
              and ref.agn_tab_in_codigo = fat.agn_tab_in_codigo
              and ref.agn_pad_in_codigo = fat.agn_pad_in_codigo
              and ref.agn_in_codigo     = fat.agn_in_codigo
              and ref.agn_tau_st_codigo = fat.agn_tau_st_codigo
              and ref.fpa_tpd_st_codigo = fat.fpa_tpd_st_codigo
              and ref.ser_tab_in_codigo = fat.ser_tab_in_codigo
              and ref.ser_st_codigo     = fat.ser_st_codigo
              and ref.ser_in_sequencia  = fat.ser_in_sequencia
              and ref.fpa_in_contador   = fat.fpa_in_contador
          )
) q;
select * into #notas from (
        -- ======================= bloco 1: contas a pagar =======================
        select
            bxa.bxmov_in_numlancto            as idLancamento,
            mov.fil_in_codigo                 as idFilial,
            rat.pro_st_apelido                as obra_id,
            rat.cla_st_extenso                as idPlanoContas,
            rat.cla_in_reduzido               as ref,
            mov.agn_in_codigo                 as idFornecedor,
            age.agn_st_nome                   as fornecedor,
            case when age.tab05_in_codigo = 2 then null else age.agn_st_cgc end as cnpj,
            case fat.tipo
                when 'REFERENCIA' then cast(fat.ref_st_numeronf as varchar(60))
                else cast(fat.fpa_in_numero as varchar(60))
            end                               as numero_nf,
            cast(fat.fpa_tpd_st_codigo as varchar(20)) as tipoDocumento,
            cast(bxa.fintpd_st_codigo  as varchar(20)) as tipoDocumentoBaixa,
            fat.data_emissao                  as data_emissao,
            bxa.bxmov_dt_datadocto            as data_pagamento,
            case fat.tipo
                when 'REFERENCIA' then fat.ref_re_valornf
                else round(((bxa.bxmov_re_valordeb * rat.lcl_re_percentual / 100.0) * rat.lpr_re_percentual) / 100.0, 2)
            end                               as valor
        from #rateio rat
        inner join mega.fin_contaspagar cap
            on  cap.org_tab_in_codigo = rat.org_tab_in_codigo
            and cap.org_pad_in_codigo = rat.org_pad_in_codigo
            and cap.org_in_codigo     = rat.org_in_codigo
            and cap.org_tau_st_codigo = rat.org_tau_st_codigo
            and cap.mov_tab_in_codigo = rat.mov_tab_in_codigo
            and cap.mov_seq_in_codigo = rat.mov_seq_in_codigo
            and cap.mov_in_numlancto  = rat.mov_in_numlancto
        inner join #faturaPagar fat
            on  fat.org_tab_in_codigo      = cap.org_tab_in_codigo
            and fat.org_pad_in_codigo      = cap.org_pad_in_codigo
            and fat.org_in_codigo          = cap.org_in_codigo
            and fat.org_tau_st_codigo      = cap.org_tau_st_codigo
            and fat.agn_tab_in_codigo      = cap.agn_tab_in_codigo
            and fat.agn_pad_in_codigo      = cap.agn_pad_in_codigo
            and fat.agn_in_codigo          = cap.agn_in_codigo
            and fat.agn_tau_st_codigo      = cap.agn_tau_st_codigo
            and fat.fpa_tpd_st_codigo_join = cap.fpa_tpd_st_codigo
            and fat.ser_tab_in_codigo      = cap.ser_tab_in_codigo
            and fat.ser_st_codigo          = cap.ser_st_codigo
            and fat.ser_in_sequencia       = cap.ser_in_sequencia
            and fat.fpa_in_numero          = cap.fpa_in_numero
            and fat.fpa_in_contador        = cap.fpa_in_contador
        inner join mega.fin_movimento mov
            on  mov.org_tab_in_codigo = cap.org_tab_in_codigo
            and mov.org_pad_in_codigo = cap.org_pad_in_codigo
            and mov.org_in_codigo     = cap.org_in_codigo
            and mov.org_tau_st_codigo = cap.org_tau_st_codigo
            and mov.mov_tab_in_codigo = cap.mov_tab_in_codigo
            and mov.mov_seq_in_codigo = cap.mov_seq_in_codigo
            and mov.mov_in_numlancto  = cap.mov_in_numlancto
        inner join #baixasCpa bxa
            on  bxa.org_tab_in_codigo = mov.org_tab_in_codigo
            and bxa.org_pad_in_codigo = mov.org_pad_in_codigo
            and bxa.org_in_codigo     = mov.org_in_codigo
            and bxa.org_tau_st_codigo = mov.org_tau_st_codigo
            and bxa.mov_tab_in_codigo = mov.mov_tab_in_codigo
            and bxa.mov_seq_in_codigo = mov.mov_seq_in_codigo
            and bxa.mov_in_numlancto  = mov.mov_in_numlancto
            and bxa.bxmov_in_numlanctoestorno is null
        left join mega.glo_agentes age
            on  fat.agn_tab_in_codigo = age.agn_tab_in_codigo
            and fat.agn_pad_in_codigo = age.agn_pad_in_codigo
            and fat.agn_in_codigo     = age.agn_in_codigo
        where fat.data_emissao >= '2026-01-01'

        union all

        -- ====================== bloco 2: contas a receber ======================
        select
            bxa.bxmov_in_numlancto            as idLancamento,
            mov.fil_in_codigo                 as idFilial,
            rat.pro_st_apelido                as obra_id,
            rat.cla_st_extenso                as idPlanoContas,
            rat.cla_in_reduzido               as ref,
            mov.agn_in_codigo                 as idFornecedor,
            cia.agn_st_nome                   as fornecedor,
            case when cia.tab05_in_codigo = 2 then null else cia.agn_st_cgc end as cnpj,
            cast(fat.fre_in_numero     as varchar(60)) as numero_nf,
            cast(fat.fre_tpd_st_codigo as varchar(20)) as tipoDocumento,
            cast(bxa.fintpd_st_codigo  as varchar(20)) as tipoDocumentoBaixa,
            fat.fre_dt_emissao                as data_emissao,
            bxa.bxmov_dt_datadocto            as data_pagamento,
            round(((bxa.bxmov_re_valorcre * rat.lcl_re_percentual / 100.0) * rat.lpr_re_percentual) / 100.0, 2) as valor
        from #rateio rat
        inner join mega.fin_contasreceber car
            on  car.org_tab_in_codigo = rat.org_tab_in_codigo
            and car.org_pad_in_codigo = rat.org_pad_in_codigo
            and car.org_in_codigo     = rat.org_in_codigo
            and car.org_tau_st_codigo = rat.org_tau_st_codigo
            and car.mov_tab_in_codigo = rat.mov_tab_in_codigo
            and car.mov_seq_in_codigo = rat.mov_seq_in_codigo
            and car.mov_in_numlancto  = rat.mov_in_numlancto
        inner join mega.fin_faturareceber fat
            on  fat.org_tab_in_codigo = car.org_tab_in_codigo
            and fat.org_pad_in_codigo = car.org_pad_in_codigo
            and fat.org_in_codigo     = car.org_in_codigo
            and fat.org_tau_st_codigo = car.org_tau_st_codigo
            and fat.fre_tpd_st_codigo = car.fre_tpd_st_codigo
            and fat.ser_tab_in_codigo = car.ser_tab_in_codigo
            and fat.ser_st_codigo     = car.ser_st_codigo
            and fat.ser_in_sequencia  = car.ser_in_sequencia
            and fat.fre_in_numero     = car.fre_in_numero
        inner join mega.fin_movimento mov
            on  mov.org_tab_in_codigo = car.org_tab_in_codigo
            and mov.org_pad_in_codigo = car.org_pad_in_codigo
            and mov.org_in_codigo     = car.org_in_codigo
            and mov.org_tau_st_codigo = car.org_tau_st_codigo
            and mov.mov_tab_in_codigo = car.mov_tab_in_codigo
            and mov.mov_seq_in_codigo = car.mov_seq_in_codigo
            and mov.mov_in_numlancto  = car.mov_in_numlancto
        inner join #baixasCre bxa
            on  bxa.org_tab_in_codigo = mov.org_tab_in_codigo
            and bxa.org_pad_in_codigo = mov.org_pad_in_codigo
            and bxa.org_in_codigo     = mov.org_in_codigo
            and bxa.org_tau_st_codigo = mov.org_tau_st_codigo
            and bxa.mov_tab_in_codigo = mov.mov_tab_in_codigo
            and bxa.mov_seq_in_codigo = mov.mov_seq_in_codigo
            and bxa.mov_in_numlancto  = mov.mov_in_numlancto
        left join mega.glo_agentes cia
            on  fat.agn_tab_in_codigo = cia.agn_tab_in_codigo
            and fat.agn_pad_in_codigo = cia.agn_pad_in_codigo
            and fat.agn_in_codigo     = cia.agn_in_codigo
        where fat.fre_dt_emissao >= '2026-01-01'

        union all

        -- ========================= bloco 3: retencoes =========================
        select
            fin.mov_in_numlancto              as idLancamento,
            fin.fil_in_codigo                 as idFilial,
            rat.pro_st_apelido                as obra_id,
            rat.cla_st_extenso                as idPlanoContas,
            rat.cla_in_reduzido               as ref,
            r.agn_in_codigo                   as idFornecedor,
            ag.agn_st_nome                    as fornecedor,
            case when ag.tab05_in_codigo = 2 then null else ag.agn_st_cgc end as cnpj,
            cast(r.fre_in_numero     as varchar(60)) as numero_nf,
            cast(r.fre_tpd_st_codigo as varchar(20)) as tipoDocumento,
            cast('' as varchar(20))           as tipoDocumentoBaixa,
            r.fre_dt_emissao                  as data_emissao,
            fin.mov_dt_datadocto              as data_pagamento,
            rat.lpr_re_valor                  as valor
        from #rateio rat
        inner join mega.fin_movimento fin
            on  fin.org_tab_in_codigo = rat.org_tab_in_codigo
            and fin.org_pad_in_codigo = rat.org_pad_in_codigo
            and fin.org_in_codigo     = rat.org_in_codigo
            and fin.org_tau_st_codigo = rat.org_tau_st_codigo
            and fin.mov_tab_in_codigo = rat.mov_tab_in_codigo
            and fin.mov_seq_in_codigo = rat.mov_seq_in_codigo
            and fin.mov_in_numlancto  = rat.mov_in_numlancto
        inner join mega.glo_acao a
            on  a.acao_tab_in_codigo = fin.acao_tab_in_codigo
            and a.acao_pad_in_codigo = fin.acao_pad_in_codigo
            and a.acao_in_codigo     = fin.acao_in_codigo
            and upper(a.acao_st_nome) like N'%RETENÇÃO%'
        inner join mega.fin_faturareceber r
            on  r.acaom_in_sequencia = fin.acaom_in_sequencia
        inner join mega.glo_agentes ag
            on  r.agn_tab_in_codigo = ag.agn_tab_in_codigo
            and r.agn_pad_in_codigo = ag.agn_pad_in_codigo
            and r.agn_in_codigo     = ag.agn_in_codigo
        where r.fre_dt_emissao >= '2026-01-01'
) q;
select
  idLancamento, idFilial, obra_id, idPlanoContas, ref, idFornecedor, fornecedor, cnpj,
  numero_nf, tipoDocumento, tipoDocumentoBaixa, data_emissao, data_pagamento, valor
from #notas
order by idLancamento, obra_id, ref, numero_nf;`;
