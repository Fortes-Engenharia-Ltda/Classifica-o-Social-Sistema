# Manual Operacional e Guia de Apresentação: Portal Classificação Social (Fortificar)

Este manual documenta o objetivo do **Portal Classificação Social (Fortificar)**, seu fluxo operacional e o detalhamento funcional de cada tela, aba e botão da interface.

---

## 1. Visão Geral e Objetivo do Sistema

### 1.1 O que é o Portal?
O **Portal Classificação Social** é a plataforma corporativa oficial de controle orçamentário, prestação de contas e acompanhamento dos investimentos sociais da **Fortes Engenharia**, viabilizados por meio do programa **Fortificar**.

### 1.2 Qual o problema que ele resolve?
* **Cenário Anterior:** As notas fiscais e comprovantes de despesas emitidos contra as contas do Fortificar eram extraídos manualmente do ERP Mega em planilhas Excel. O processo de enriquecimento e classificação dependia de controle descentralizado, suscetível a erros, retrabalho e falta de rastreabilidade.
* **Cenário Atual:** O sistema integra-se diretamente ao **Data Warehouse corporativo (Azure SQL - bases `FortesStaging` e `FortesDW`)**. As notas fiscais do Fortificar são sincronizadas de forma contínua ou sob demanda, permitindo que a equipe de sustentabilidade e responsabilidade social audite, classifique e vincule cada despesa às respectivas metas sociais, projetos e instituições parceiras (OSCs).

### 1.3 Pilares de Valor do Sistema
1. **Sincronização Segura e Contínua com o DW:** Importação inteligente da view `FortesStaging.dbo.vw_notas_fiscais` que preserva classificações já realizadas e identifica novos lançamentos ou rateios de forma incremental.
2. **Classificação Orçamentária Eficiente:** Classificação individual, em grade (*inline*) ou em lote, vinculando cada despesa a:
   * **Orçado vs. Não Orçado**
   * **Programa Social**
   * **Instituição Parceira (OSC)**
   * **Projeto Social**
   * **Classificação do Projeto ATT**
   * **Obra / Unidade de Negócio**
3. **Visibilidade Gerencial e Curva S:** Dashboards em tempo real com curva Previsto x Realizado mensal por projeto, indicadores de pessoas beneficiadas e distribuição por localização e programa.
4. **Governança de OSCs:** Credenciamento com geração de links externos temporários para que as próprias entidades parceiras preencham seus dados para homologação interna.

---

## 2. Estrutura Global: Cabeçalho (Navbar) e Menu Lateral (Sidebar)

A navegação permanece acessível em todas as telas protegidas do sistema.

### 2.1 Barra Superior (Navbar)
* **Logo / Marca Fortificar:** Ao clicar na marca, o usuário é redirecionado instantaneamente para a tela principal (**Dashboard**).
* **Botão Alternar Tema (Sol / Lua):** Permite alternar entre o **Modo Claro** e o **Modo Escuro (Dark Mode)**, garantindo ergonomia visual.
* **Identificação do Usuário:** Exibe o primeiro nome do usuário logado e sua respectiva permissão (*MASTER, ADMIN, MANAGER ou ANALYST*).
* **Avatar / Foto de Perfil (Botão Circular):** Abre o menu suspenso de autoatendimento com as opções:
  * **Alterar foto:** Carrega uma nova foto de perfil a partir do computador.
  * **Excluir foto:** Remove a imagem personalizada.
  * **Alterar nome:** Permite atualizar o nome de exibição (o e-mail corporativo permanece protegido e fixo).
  * **Trocar senha:** Abre formulário de segurança com o botão **"Enviar código por email"**. O usuário recebe um código de 6 dígitos no e-mail corporativo para validar a criação da nova senha.
* **Botão Logout (Ícone de Saída Vermelho):** Encerra a sessão com segurança e revoga o token JWT.

### 2.2 Menu Lateral Retrátil (Sidebar)
* **Botão Retrair / Expandir (Menu / X):** Alterna a largura da barra lateral entre o modo compacto (apenas ícones) e o modo expandido (com rótulos textuais completos).
* **Itens do Menu de Navegação:**
  1. 📊 **Dashboard:** Indicadores macro, gráficos de despesas e curva temporal.
  2. 📄 **Notas Fiscais:** Painel operacional de classificação, importação e edição de despesas.
  3. 📋 **Projetos:** Gestão dos projetos sociais, participantes e cronograma financeiro.
  4. 🏢 **Instituições:** Credenciamento e homologação jurídica de OSCs parceiras.
  5. 👥 **Usuários:** Gestão de acessos da equipe interna.
  6. 🏷️ **Administração:** Cadastros de apoio (Programas, Contas, Obras do DW, Públicos-Alvo).
  7. ⚙️ **Configuração do Sistema:** Parametrização de perfis, conexões de banco e templates de e-mail.

---

## 3. Guia Detalhado por Tela e Função dos Botões

---

### 3.1 Tela de Login e Recuperação de Acesso (`/login`)

| Elemento / Botão | Tipo | O que faz? |
| :--- | :--- | :--- |
| **Campo Email** | Entrada de texto | Digitação do e-mail corporativo do colaborador. |
| **Campo Senha** | Senha | Campo com máscara de segurança para digitação da senha. |
| **Ícone Olho (Mostrar/Ocultar)** | Botão de alternância | Revela ou oculta os caracteres da senha para conferência. |
| **Botão "Entrar"** | Botão primário | Autentica as credenciais via API e direciona para o Dashboard. |
| **Link "Esqueci minha senha"** | Ação de suporte | Abre a modal de autosserviço: o usuário digita seu e-mail, clica em **"Enviar código"**, recebe o código no e-mail e define sua nova senha diretamente. |

---

### 3.2 Tela de Dashboard Gerencial (`/dashboard`)

O Dashboard consolida os dados das notas fiscais e projetos, servindo como a principal tela de acompanhamento para gestores e diretoria.

#### Painel de Filtros Avançados (Barra Lateral ou Superior)
* **Botão "Recolher / Expandir filtros":** Alterna a visualização da barra de filtros para maximizar o espaço dos gráficos.
* **Seletores de Período (Data Início / Data Fim):** Delimita o intervalo de emissão ou competência analisado.
* **Dropdowns com Busca Integrada:** Filtros múltiplos pesquisáveis para **Programa**, **Classificação**, **Orçado / Não Orçado**, **Obra** e **Projeto**.
  * Cada filtro possui internamente os botões:
    * **"Limpar seleção":** Desmarca todos os itens daquele filtro.
    * **"Selecionar todos":** Marca todas as opções de uma só vez.
* **Botão "Limpar filtros":** Reseta instantaneamente todos os seletores para o padrão do sistema.

#### Indicadores Estratégicos (StatCards)
1. **⚠️ Pendência de Classificação:** Mostra quantas NFs sincronizadas ainda exigem classificação.
2. **💼 Valor Total Orçado:** Somatório em R$ de notas classificadas formalmente como despesa orçada.
3. **🧾 Valor Total Não Orçado:** Somatório em R$ de despesas realizadas fora da previsão original.
4. **💰 Valor Total de NFs:** Volume financeiro total acumulado no filtro selecionado.
5. **🏢 Instituições:** Quantidade de entidades sociais parceiras ativas.
6. **🏗️ Obras Ativas:** Total de frentes de trabalho corporativas vinculadas às despesas.
7. **📈 Valor Previsto Projetos:** Orçamento planejado na criação dos projetos.
8. **👥 Total Pessoas Impactadas:** Número de cidadãos beneficiados diretamente pelas iniciativas.

#### Gráficos e Componentes Visuais
* **Curva Previsto x Realizado por Projeto (Mês/Ano):** Gráfico de linhas interativo que compara o cronograma de desembolso planejado mês a mês contra as notas fiscais efetivamente pagas/lançadas.
* **Distribuição Orçado x Não Orçado:** Gráfico de colunas comparativo.
* **Quantidade por Localização:** Gráfico de barras indicando a destinação geográfica dos recursos.
* **Gráficos com Toggle "Quantidade" / "Valor (R$)":**
  * *NFs por Programa / Valor por Programa*
  * *NFs por Classificação / Valor por Classificação*
  * *NFs por Obra / Valor por Obra*
  * **Botões de alternância:** Permitem mudar a visualização instantaneamente entre número de documentos emitidos e volume em Reais.
* **Card "Alertas Ativos":** Lista notas fiscais ou lançamentos que exigem atenção imediata.

---

### 3.3 Tela de Notas Fiscais (`/notas-fiscais`) — *O Coração Operacional do Sistema*

Esta é a tela de uso rotineiro da equipe, onde o fluxo de triagem e classificação acontece.

#### Barra de Ações do Topo
* **Texto de Status do DW:** Mostra a data/hora exata da última sincronização bem-sucedida e avisa que a atualização roda a cada 30 minutos em segundo plano.
* **Botão "Sincronizar com DW" (Ícone Refresh):** 
  * Faz a leitura direta da view `FortesStaging.dbo.vw_notas_fiscais` (Azure SQL).
  * Importa novas despesas sem jamais sobrescrever classificações já salvas por usuários.
* **Botão "Exportar Excel" (Ícone Download):** Gera e baixa imediatamente uma planilha formatada com todas as notas fiscais e suas respectivas colunas classificadas.
* **Botão "Nova Nota Fiscal" (Ícone Mais):** Abre modal para lançamento manual de uma NF ou reembolso excepcional.

#### Barra de Ferramentas da Tabela
* **Seletor de Linhas por Página:** Opções para exibir `5`, `10`, `20`, `100` ou `Personalizado` (com campo numérico e botão **"Aplicar"**).
* **Botão "Selecionar todas desta página":** Marca ou desmarca todas as caixas de seleção da página atual.
* **Botão "Editar Coluna (Todas)" / "Encerrar edição":** Ativa o modo de edição em planilha (*inline*). Todas as linhas viram campos editáveis diretamente na tabela.
* **Botão "Classificar selecionadas (X)":** Abre o modal de classificação em lote para aplicar os mesmos atributos (Programa, Projeto, etc.) a dezenas de notas de uma vez só.
* **Botões "Excluir selecionadas" e "Excluir todas as NFs" (Exclusivo Master):** Permitem higienização controlada da base em caso de reprocessamento.

#### Colunas da Tabela e Ações por Linha
* **Cabeçalhos Clicáveis:** Permitem ordenar de forma crescente ou decrescente por qualquer coluna (*Cód. Documento, Razão Social, Valor, Período, Localização, Código de Ação, Unidade de Negócio, Orçado/Não Orçado, Programa, Instituição, Projeto, Classificação ATT, Status*).
* **Alças de Redimensionamento:** Cada coluna possui uma linha divisória que pode ser arrastada para ajustar sua largura em tela.
* **Badge de Status:**
  * 🟡 **Pendente:** Nota fiscal nova ou que ainda não possui todos os campos obrigatórios preenchidos.
  * 🟢 **Completa:** Nota com todos os atributos preenchidos e validada para compor os relatórios.
* **Botões dentro da linha:**
  * **"Classificar":** Abre o modal completo de classificação para aquela nota individual.
  * **"Editar linha":** Permite editar rapidamente os dados diretamente na linha da tabela.
  * **"Salvar linha":** Grava as alterações feitas no modo inline.
  * **"Limpar alterações":** Reverte as edições não salvas na linha.

#### Modal de Classificação (Individual ou em Lote)
* **Campos Estruturantes Obrigatórios:**
  * *Orçado / Não Orçado:* Dropdown para escolher entre `Orçado` e `Não Orçado`.
  * *Programa:* Dropdown com os programas sociais ativos cadastrados.
  * *Instituição:* Dropdown com as OSCs parceiras cadastradas.
  * *Projeto:* Dropdown dos projetos vinculados. Ao selecionar, o campo exibe dinamicamente o **Público-Alvo** associado.
  * *Classificação do Projeto ATT:* Categoria de prestação social.
  * *Classe e Classificação Conta:* Detalhamento contábil.
* **Campos Opcionais Editáveis:**
  * *Histórico, Unidade de Negócio, Data de Pagamento, Razão Social, Valor, Código do Documento e Observações.*
* **Botão "Salvar Classificação":** Persiste os dados, remove a NF da pendência e atualiza os dashboards.
* **Botão "Cancelar" ou "X":** Descarta as alterações sem salvar.

---

### 3.4 Tela de Projetos Sociais (`/projetos`)

Espaço dedicado ao planejamento dos projetos apoiados pela empresa, seus orçamentos e cronogramas.

#### Ações Principais do Cabeçalho
* **Alternador de Visualização:**
  * **Botão "Cards" (Ícone Grade):** Exibe cada projeto em formato de cartão visual, ideal para reuniões e acompanhamento de status.
  * **Botão "Tabela" (Ícone Tabela):** Exibe a lista densa com colunas redimensionáveis para ordenação por valor, período ou participantes.
* **Botão "Novo Projeto" (Ícone Mais):** Abre formulário para cadastrar uma nova iniciativa social:
  * *Campos:* Nome do Projeto, Instituição parceira responsável, Descrição dos objetivos, Público-Alvo, Data Início, Data Fim, Valor Estimado Previsto (R$) e Meta de pessoas impactadas.

#### Ações Disponíveis em Cada Projeto
* **Botão "Ver detalhes" (Ícone Olho):** Abre modal de ficha técnica com todos os dados cadastrais, resumo de impacto e progresso financeiro.
* **Botão "Distribuição" / "Cronograma" (Ícone Calendário):** 
  * Permite dividir o orçamento total previsto ao longo dos meses de vigência do projeto.
  * O sistema sugere uma divisão mensal automática, mas o usuário pode editar manualmente os valores de cada mês/ano (ex: `01/2026`, `02/2026`).
  * **Impacto:** Essa distribuição alimenta a linha de **"Previsto"** na Curva Previsto x Realizado do Dashboard.
* **Botão "Editar" (Ícone Lápis):** Abre o formulário com dados pré-carregados para atualizar prazos, metas ou orçamento.
* **Botão "Excluir" (Ícone Lixeira):** Exclui o projeto (com confirmação em tela).

---

### 3.5 Tela de Instituições / OSCs (`/instituicoes`)

Responsável pela governança, auditoria jurídica e credenciamento das Organizações da Sociedade Civil parceiras.

#### 1. Aba "Tabela" (Instituições Homologadas)
* Exibe a listagem completa das entidades aprovadas com CNPJ, contatos, representantes legais e status de vigência.
* **Botão "Gerar Link de Cadastro Externo":**
  * Abre uma janela onde o usuário define o prazo de validade (em Minutos, Horas ou Dias).
  * O sistema gera uma URL única e segura (ex: `/cadastros?token=XYZ`).
  * **Botão "Copiar link":** Copia a URL para ser enviada por WhatsApp ou e-mail à instituição parceira.
* **Botão "Contratos" (por instituição):** Abre modal para vincular ou consultar termos de fomento, convênios e obras vinculadas da Fortes.
* **Botão "Editar" e "Excluir":** Gestão cadastral direta.

#### 2. Aba "Cadastro" (Cadastro Interno)
* Formulário administrativo completo para quando a própria equipe interna da Fortes for preencher os dados da entidade (Dados cadastrais, Endereço, Contas bancárias, Diretoria e Responsáveis Técnicos).

#### 3. Aba "Revisão" (Mesa de Homologação)
* Lista todas as submissões enviadas pelas entidades através dos links externos.
* O analista/gestor clica no cadastro e tem acesso à ficha completa para validação documental.
* **Botões de Decisão:**
  * **Botão "Aprovar":** Homologa a instituição, integrando-a imediatamente aos seletores de NFs e Projetos.
  * **Botão "Solicitar Ajustes":** Abre campo de parecer para apontar pendências (ex: "Atualizar certidão negativa") e gera automaticamente um link seguro para a entidade corrigir os dados.
  * **Botão "Rejeitar":** Indefere a solicitação justificando o motivo nos registros de auditoria.
  * **Botão "Reabrir":** Reavalia cadastros já arquivados.

---

### 3.6 Tela de Administração de Cadastros (`/admin-cadastros`)

Centraliza os cadastros auxiliares e tabelas de apoio que mantêm o ecossistema padronizado.

1. **Aba "Orçado/Não Orçado":** Permite criar ou inativar nomenclaturas de tipos de orçamento.
2. **Aba "Classificação de Contas":** Tabela de correspondência que traduz os Códigos de Ação do ERP Mega em tipos de despesa compreensíveis.
3. **Aba "Classificação":** Cadastro dos tipos de classificação de projeto social.
4. **Aba "Programas Sociais":** Gestão dos macroprogramas do Fortificar (ex: Fortificar Comunidade, Fortificar Educação).
5. **Aba "Obras":**
   * **Botão "Sincronizar dProjetos (FortesDW)":** Importa e atualiza os centros de custo e obras corporativas ativas diretamente do banco Azure SQL da Fortes.
   * **Botão "Nova Obra":** Permite inserir manualmente um novo centro de custo, unidade de negócio ou localidade.
   * **Filtros e Seletor de Colunas:** Permite customizar quais atributos de obra exibir na tela.
6. **Aba "Públicos Alvo":** Cadastro das faixas e perfis atendidos (ex: Estudantes da rede pública, Famílias em vulnerabilidade, etc.).

---

### 3.7 Tela de Gestão de Usuários (`/usuarios`)

Controla quem acessa a plataforma e seus níveis de permissão.

* **Campo de Busca:** Pesquisa em tempo real por nome ou e-mail corporativo.
* **Botão "Novo Usuário" (Ícone Mais):** 
  * Abre formulário com Nome, E-mail, Data de Nascimento, Perfil (*MASTER, ADMIN, MANAGER ou ANALYST*) e Senha inicial.
  * Ao salvar, o sistema envia automaticamente um e-mail de boas-vindas com as instruções de acesso.
* **Botão de Status "Ativo / Inativo":** Desabilita ou reabilita o acesso do colaborador ao sistema instantaneamente (o usuário logado é protegido contra auto-inativação).
* **Botão "Editar":** Permite alterar o perfil de acesso ou atualizar dados de contato.
* **Botão "Enviar redefinição de senha" (Ícone Envelope):** Dispara um e-mail oficial para o usuário redefinir sua senha com segurança.

---

### 3.8 Tela de Configuração do Sistema (`/configuracao-sistema`) — *Exclusiva Master / Manager*

Garante a governança e o funcionamento técnico da plataforma.

* **Aba "Usuários":** Painel de administração avançada para redefinição forçada de credenciais e auditoria de perfis.
* **Aba "Módulos por Perfil":** Matriz de Controle de Acesso (RBAC). Permite que os gestores marquem ou desmarquem exatamente quais módulos do menu cada nível de usuário tem permissão para visualizar.
* **Aba "Banco de Dados":** Visualização dos parâmetros de conexão com o Azure SQL corporativo (`FortesDW` e `FortesStaging`), porta e credenciais de leitura, com botão **"Salvar Configurações"**.
* **Aba "Email (SMTP e Templates)":**
  * Configuração do servidor de disparo Microsoft 365 / SMTP institucional.
  * **Campo e Botão "Testar Envio":** Envia um e-mail de teste para validar a conectividade do servidor.
  * **Editor de Templates de E-mail:** Permite personalizar o assunto e o texto em HTML dos e-mails automáticos enviados pelo sistema (*Boas-vindas, Troca de senha e Parecer de Homologação de OSCs*), com injeção dinâmica de variáveis como `{{nome}}`, `{{codigo}}` e `{{linkAjustes}}`.

---

## 4. Roteiro Prático Sugerido para a Apresentação (Passo a Passo)

Para uma demonstração clara e de alto impacto de **7 a 10 minutos**, siga esta sequência:

```
[1. Contexto & Login] ➔ [2. Sincronização & Classificação] ➔ [3. Visualização no Dashboard] ➔ [4. Gestão de Projetos & Curva S] ➔ [5. Governança de OSCs]
```

1. **Abertura (1 min) — O Contexto:**
   * Apresente a tela de login e contextualize: *“O Portal Classificação Social foi criado para dar velocidade, conformidade e transparência à gestão dos recursos do programa Fortificar, conectando o ERP Mega diretamente à tomada de decisão.”*

2. **O Coração do Sistema — Notas Fiscais e Sincronização DW (3 min):**
   * Vá para **Notas Fiscais**. Mostre a data de atualização e clique em **"Sincronizar com DW"**.
   * Explique que o sistema traz as despesas do FortesStaging sem sobrescrever nenhuma classificação anterior.
   * Destaque o botão **"Editar Coluna (Todas)"**: mostre como é simples classificar várias notas em formato de grade ou usar o botão **"Classificar selecionadas"** para classificação em lote.
   * Demonstre o preenchimento: Orçado/Não Orçado, Programa, OSC, Projeto e Classificação ATT. Mostre a nota passando de *Pendente* para *Completa*.

3. **Apresentação Executiva — Dashboard em Tempo Real (2 min):**
   * Navegue para o **Dashboard**.
   * Mostre como a nota recém-classificada reduziu o contador de *Pendências* e alimentou os totais de *Valor Orçado* e *Valor Não Orçado*.
   * Demonstre a barra de filtros pesquisáveis e o alternador de métricas (*Quantidade* vs *Valor em R$*).
   * Apresente a **Curva Previsto x Realizado por Projeto**, ressaltando que ela permite à diretoria saber exatamente se o plano de desembolso social está sendo cumprido mês a mês.

4. **Planejamento e Impacto Social — Projetos (2 min):**
   * Acesse a tela **Projetos**. Alterne entre a visão de **Cards** e **Tabela**.
   * Mostre o botão **"Distribuição"** e explique como o orçamento do projeto é fatiado pelas competências mensais, originando a curva S do dashboard.
   * Destaque a mensuração de pessoas impactadas e a amarração direta com a instituição parceira.

5. **Inovação em Governança — Instituições e Link Externo (1 min):**
   * Vá para **Instituições**.
   * Destaque o botão **"Gerar Link de Cadastro Externo"**: explique que a Fortes não precisa mais receber documentos por e-mail de forma desorganizada. A entidade recebe um link com validade temporária, preenche seus dados e os analistas realizam a aprovação na aba **Revisão**.

6. **Fechamento e Governança Técnica (30 seg):**
   * Passe rapidamente pelas telas de **Administração** (sincronização de obras com o DW) e **Configurações do Sistema** (permissões por módulo e integração de e-mails), finalizando com a segurança e robustez do ambiente.
