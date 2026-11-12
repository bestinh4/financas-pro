import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'Nenhuma imagem de comprovante foi recebida.' });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Você é um auditor financeiro e contábil sênior especializado em documentos fiscais e bancários brasileiros (cupons fiscais NFC-e, notas fiscais, recibos, faturas e comprovantes de transferência PIX ou TED).

Analise atentamente a imagem deste comprovante ou recibo financeiro e extraia com precisão cirúrgica os seguintes dados:
1. "description": Nome fantasia ou razão social do estabelecimento ou favorecido (ex: "Restaurante La Guapa", "Supermercado Pão de Açúcar", "Posto Ipiranga", "Uber", "Droga Raia", "Enel"). Se for comprovante PIX, use o nome de quem recebeu ou a descrição da transferência.
2. "amount": Valor monetário total efetivamente pago ou transferido, em Reais (ex: 89.50). Deve ser um número decimal positivo.
3. "date": Data da transação no formato ISO "YYYY-MM-DD". Se o ano estiver ausente no cupom, adote o ano corrente (2024).
4. "type": Classifique como "Despesa" (para pagamentos, compras, débitos, contas) ou "Receita" (se for comprovante de transferência recebida na conta).
5. "category": Escolha estritamente uma destas opções pré-definidas com base no tipo de estabelecimento:
   - "Moradia" (contas de luz, água, condomínio, gás, aluguel, reparos domésticos)
   - "Alimentação" (restaurantes, delivery, supermercados, feiras, padarias, bares)
   - "Transporte" (combustível, Uber/99, estacionamento, pedágio, oficina)
   - "Saúde & Cuidados" (farmácias, consultórios, exames, academia, ótica)
   - "Lazer & Cultura" (ingressos, cinemas, viagens, hospedagem, livros, streaming)
   - "Outros" (impostos, serviços profissionais, tecnologia, compras gerais)
6. "paymentMethod": "cartao" se constar pagamento com cartão de crédito/débito, ou "conta" se for PIX, TED, dinheiro ou débito em conta.
7. "suggestedAccountOrCard": se identificado cartão XP/Visa informe "xp"; se Nubank/Mastercard informe "nubank"; se débito Itaú informe "itau"; se BTG informe "btg"; caso não identificado claramente, informe "itau".
8. "notes": Resumo conciso dos itens ou serviços (ex: "Almoço executivo 2 pessoas", "3 itens de higiene e limpeza", "Abastecimento Gasolina Comum"), autenticação bancária ou CNPJ se legível.
9. "confidence": Nível de confiança na legibilidade e extração dos dados (número de 0 a 100).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: 'Nome do estabelecimento ou favorecido' },
            amount: { type: Type.NUMBER, description: 'Valor total em Reais' },
            date: { type: Type.STRING, description: 'Data em formato YYYY-MM-DD' },
            type: { type: Type.STRING, description: 'Despesa ou Receita' },
            category: { type: Type.STRING, description: 'Categoria financeira padronizada' },
            paymentMethod: { type: Type.STRING, description: 'cartao ou conta' },
            suggestedAccountOrCard: { type: Type.STRING, description: 'ID da conta ou cartao sugerido' },
            notes: { type: Type.STRING, description: 'Resumo dos itens ou autenticacao' },
            confidence: { type: Type.NUMBER, description: 'Indice de confianca de 0 a 100' },
          },
          required: ['description', 'amount', 'date', 'type', 'category', 'paymentMethod'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.status(200).json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error('Erro na análise de comprovante com Gemini no Vercel:', err);
    return res.status(500).json({
      error: 'Falha ao processar o comprovante com IA. Verifique se a imagem está legível.',
      details: err?.message,
    });
  }
}
