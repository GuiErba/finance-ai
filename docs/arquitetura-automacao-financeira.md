# Especificação Técnica: Sistema de Automação Financeira Pessoal
## Ingestão de Gastos via WhatsApp com Processamento de IA e Sincronização no Google Sheets

---

## 1. Visão Geral do Projeto

Este projeto consiste em uma ferramenta de automação e soberania financeira, projetada para solucionar a opacidade de lançamentos consolidados em faturas de cartão de crédito. 

O sistema expõe um endpoint público (*Webhook*) hospedado na plataforma **Render**, atuando essencialmente como um **BFF (Backend-for-Frontend)** entre a interface do WhatsApp e os serviços de retaguarda. Desenvolvido em **Node.js (Express)**, o fluxo operacional compreende o recebimento de mensagens avulsas ou PDFs diretamente via **WhatsApp Cloud API**, processamento estruturado através da **Gemini API** (ou OpenAI), e persistência granular em uma base de dados no **Google Sheets**.

### Objetivos Principais
* **Granularidade Automática:** Quebrar faturas consolidadas em linhas de despesas individuais categorizadas.
* **Interface Ubíqua:** Utilizar o WhatsApp como interface de entrada única e de baixa fricção.
* **Custo-Zero Operacional:** Operar inteiramente dentro dos *Free Tiers* (Render, WhatsApp Cloud API, Gemini e Google Sheets).

---

## 2. Arquitetura do Sistema e Fluxo de Dados

O sistema adota o padrão de arquitetura orientada a eventos baseada em webhooks (Event-Driven Webhook Architecture). 

```
[ Usuário ] 
    │
    ├─► (Texto: "iFood R$ 65") ──┐
    └─► (Documento: Fatura.pdf) ─┼─► [ WhatsApp Cloud API (Meta) ]
                                            │
                                            ▼ (HTTP POST Webhook JSON)
                                    [ Node.js API / Render (BFF) ]
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼ (Fluxo de Texto Avulso)                                 ▼ (Fluxo de PDF/Fatura)
    ┌──────────────────────────────┐                         ┌────────────────────────────────────────┐
    │ Extração imediata do Payload │                         │ 1. Download do Binário via Mídia API  │
    └──────────────┬───────────────┘                         │ 2. Conversão para Base64 / Stream      │
                   │                                         └───────────────────┬────────────────────┘
                   │                                                             │
                   └───────────────────────┐             ┌───────────────────────┘
                                           ▼             ▼
                                    [ Gemini / OpenAI API ]
                                    (Prompting & Structured Output)
                                           │
                                           ▼ (JSON Estruturado Válido)
                                    [ Google Sheets API ]
                                           │
                                           ▼ (Append Row)
                                    [ Planilha de Destino ]
```

### Detalhamento do Fluxo Técnico
1. **Gatilho de Ingestão:** A Meta dispara uma requisição `HTTP POST` contendo um payload JSON estruturado para o webhook.
2. **Triagem no Backend:** A API em Node.js valida o token de segurança da Meta (`X-Hub-Signature-256`) e identifica o tipo de mensagem (`text` ou `document`).
   * **Se Texto:** Extrai a string bruta.
   * **Se Documento (PDF):** Captura o `media_id`, faz uma requisição para obter a URL de download, baixa o buffer do PDF.
3. **Camada de Inteligência (LLM):** O backend consome a API da IA enviando o contexto. A IA processa o documento usando *Structured Outputs* (JSON Schema).
4. **Camada de Persistência:** O backend recebe o JSON, inicializa o cliente de autenticação do Google, e executa um `spreadsheets.values.append` de forma atômica.

---

## 3. Stack Tecnológica e Infraestrutura

* **Ambiente de Desenvolvimento:** Cursor AI.
* **Runtime:** Node.js (Versão LTS >= 20.x).
* **Framework Web:** Express.js (leve e com baixo overhead).
* **Hospedagem Back-end:** Render (Plano Web Service Free).
* **Processamento Cognitivo:** Gemini API (`gemini-2.5-flash`).
* **Persistência:** Google Sheets via Google APIs Node.js Client (`googleapis`).

---

## 4. Engenharia de Prompts e Modelagem de Dados

Para garantir estabilidade, o modelo de linguagem deve responder **estritamente** em formato JSON.

### JSON Schema Esperado da IA (Output Estruturado)
```json
{
  "status": "success",
  "total_processado": 5000.00,
  "transacoes": [
    {
      "data": "2026-07-10",
      "estabelecimento": "Mercado Livre",
      "categoria": "Eletrodomésticos",
      "valor": 1200.00
    }
  ]
}
```

### System Prompt para Processamento
```text
Você é um parser de dados financeiros de alta precisão. Seu objetivo é ler o input fornecido e extrair todas as transações de débito/crédito.

Regras Estritas:
1. Ignore pagamentos de faturas anteriores, foque apenas nos gastos/compras.
2. Formate a data para o padrão ISO (AAAA-MM-DD).
3. Categorize cada gasto em uma das seguintes categorias padronizadas: [Alimentação, Transporte, Lazer, Saúde, Assinaturas, Casa, Vestuário, Educação, Outros].
4. Retorne unicamente o objeto JSON conforme o schema, sem marcações markdown.
```

---

## 5. Estrutura do Projeto (Scaffolding Recomendado para o Cursor)

```text
finance-bot-webhook/
├── .env                  
├── .gitignore            
├── package.json          
├── README.md             
└── src/
    ├── server.js         
    ├── config/
    │   └── googleAuth.js 
    ├── controllers/
    │   └── webhookController.js 
    ├── services/
        ├── whatsappService.js   
        ├── aiService.js         
        └── sheetsService.js     
```

---

## 6. Configuração do Ambiente e Credenciais no Render

| Variável | Descrição |
| :--- | :--- |
| `PORT` | Porta de execução (padrão `3000`) |
| `WHATSAPP_VERIFY_TOKEN` | String para validar o webhook na Meta |
| `WHATSAPP_ACCESS_TOKEN` | Token de Acesso Permanente (System User Token) |
| `AI_API_KEY` | Chave de API do Gemini |
| `GOOGLE_SPREADSHEET_ID`| ID da URL da sua planilha |
| `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` | JSON da Service Account formatado em string única |

---

## 7. Trechos de Código Base

### Rota de Verificação e Recebimento (`src/controllers/webhookController.js`)
```javascript
import { Router } from 'express';
import { processTextMessage, processDocumentMessage } from '../services/aiService.js';

const router = Router();

router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

router.post('/webhook', async (req, res) => {
  try {
    const { body } = req;
    
    if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      return res.sendStatus(200);
    }

    const message = body.entry[0].changes[0].value.messages[0];
    
    if (message.type === 'text') {
      await processTextMessage(message.text.body);
    } else if (message.type === 'document' && message.document.mime_type === 'application/pdf') {
      await processDocumentMessage(message.document.id);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Erro no processamento do webhook:', error);
    return res.sendStatus(500);
  }
});

export default router;
```

### Escrita no Google Sheets (`src/services/sheetsService.js`)
```javascript
import { google } from 'googleapis';

const auth = new google.auth.JWT(
  JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS).client_email,
  null,
  JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS).private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

export async function appendTransactionsToSheet(transactions) {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const range = 'Dados!A:D'; 

  const rows = transactions.map(t => [
    t.data,
    t.estabelecimento,
    t.categoria,
    t.valor
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { values: rows },
  });
}
```