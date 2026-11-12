import React, { useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtractedData {
  description: string;
  amount: number;
  date: string;
  type: 'Despesa' | 'Receita';
  category: string;
  paymentMethod: 'cartao' | 'conta';
  suggestedAccountOrCard?: string;
  notes?: string;
  confidence?: number;
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, accounts, creditCards, showToast } = useFinance();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for confirmation/editing
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Despesa' as 'Despesa' | 'Receita',
    category: 'Alimentação',
    accountOrCard: 'itau',
    notes: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setImagePreview(null);
    setExtractedData(null);
    setErrorMessage(null);
    setIsScanning(false);
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Despesa',
      category: 'Alimentação',
      accountOrCard: 'itau',
      notes: '',
    });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const processImage = async (base64Data: string, typeStr: string) => {
    setIsScanning(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: typeStr,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Não foi possível ler o documento.');
      }

      const data: ExtractedData = result.data;
      setExtractedData(data);

      // Determine best matching account or card
      let matchedAcc = 'itau';
      if (data.paymentMethod === 'cartao') {
        matchedAcc = data.suggestedAccountOrCard === 'nubank' ? 'nubank' : 'xp';
      } else if (data.suggestedAccountOrCard && accounts.some((a) => a.id === data.suggestedAccountOrCard)) {
        matchedAcc = data.suggestedAccountOrCard;
      }

      setFormData({
        description: data.description || 'Despesa Comercial',
        amount: data.amount ? data.amount.toString() : '',
        date: data.date || new Date().toISOString().split('T')[0],
        type: data.type === 'Receita' ? 'Receita' : 'Despesa',
        category: data.category || 'Outros',
        accountOrCard: matchedAcc,
        notes: data.notes || '',
      });

      showToast(
        'Comprovante Processado com Sucesso',
        `${data.description || 'Registro'}: R$ ${data.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} detectado pela IA.`,
        'success'
      );
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro de comunicação ao processar o comprovante.');
      showToast('Aviso de Leitura', 'Ajuste os campos manualmente ou tente uma imagem mais nítida.', 'warning');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMessage('Por favor, envie um arquivo de imagem (JPG, PNG, WEBP) ou PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64Pure = resultStr.split(',')[1];
      setImagePreview(resultStr);
      setMimeType(file.type);
      processImage(base64Pure, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Demo samples for quick demonstration without needing physical receipt
  const loadDemoSample = (type: 'restaurante' | 'supermercado' | 'pix') => {
    setIsScanning(true);
    setErrorMessage(null);

    // Create lightweight demo canvas receipt image
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 550;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fefcf9';
      ctx.fillRect(0, 0, 400, 550);
      ctx.fillStyle = '#222';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';

      if (type === 'restaurante') {
        ctx.fillText('RESTAURANTE LA GUAPA LTDA', 200, 40);
        ctx.font = '12px monospace';
        ctx.fillText('CNPJ: 28.192.481/0001-92', 200, 65);
        ctx.fillText('Rua dos Pinheiros, 381 - São Paulo/SP', 200, 85);
        ctx.fillText('--------------------------------------', 200, 110);
        ctx.textAlign = 'left';
        ctx.fillText('02x ALMOCO EXECUTIVO ....... R$ 78,00', 30, 150);
        ctx.fillText('02x SUCO NATURAL LARANJA ... R$ 22,00', 30, 180);
        ctx.fillText('01x SOBREMESA ARTESANAL .... R$ 16,50', 30, 210);
        ctx.fillText('TAXA DE SERVICO (10%) ...... R$ 11,65', 30, 240);
        ctx.fillText('--------------------------------------', 200, 280);
        ctx.font = 'bold 18px monospace';
        ctx.fillText('VALOR TOTAL: R$ 128,15', 30, 320);
        ctx.font = '13px monospace';
        ctx.fillText('FORMA: CARTAO DE CREDITO VISA', 30, 360);
        ctx.fillText('DATA: 10/10/2024 - 13:42:10', 30, 390);
      } else if (type === 'supermercado') {
        ctx.fillText('PAO DE ACUCAR SUPERMERCADOS', 200, 40);
        ctx.font = '12px monospace';
        ctx.fillText('NFC-e No. 000.419.821 Serie 001', 200, 65);
        ctx.fillText('--------------------------------------', 200, 100);
        ctx.textAlign = 'left';
        ctx.fillText('01x CAFE GOURMET 500G ...... R$ 34,90', 30, 140);
        ctx.fillText('02x LEITE VEGETAL AMENDOA .. R$ 29,80', 30, 170);
        ctx.fillText('01x QUEIJO BRIE 200G ....... R$ 28,50', 30, 200);
        ctx.fillText('01x AZEITE EXTRA VIRGEM .... R$ 42,90', 30, 230);
        ctx.fillText('--------------------------------------', 200, 270);
        ctx.font = 'bold 18px monospace';
        ctx.fillText('TOTAL A PAGAR: R$ 136,10', 30, 310);
        ctx.font = '13px monospace';
        ctx.fillText('FORMA: CARTAO MASTERCARD', 30, 350);
        ctx.fillText('DATA: 18/10/2024 - 19:15:02', 30, 380);
      } else {
        ctx.fillText('COMPROVANTE DE TRANSFERENCIA PIX', 200, 40);
        ctx.font = '12px monospace';
        ctx.fillText('BANCO ITAU UNIBANCO S.A.', 200, 65);
        ctx.fillText('--------------------------------------', 200, 100);
        ctx.textAlign = 'left';
        ctx.fillText('FAVORECIDO: ENEL DISTRIBUICAO SP', 30, 140);
        ctx.fillText('CHAVE PIX: contas@enel.com.br', 30, 170);
        ctx.fillText('IDENTIFICADOR: LUZ_OUTUBRO_2024', 30, 200);
        ctx.fillText('--------------------------------------', 200, 240);
        ctx.font = 'bold 18px monospace';
        ctx.fillText('VALOR: R$ 342,80', 30, 280);
        ctx.font = '13px monospace';
        ctx.fillText('DEBITO: CONTA CORRENTE ITAU', 30, 320);
        ctx.fillText('DATA: 15/10/2024 - 09:20:15', 30, 350);
      }
    }

    const dataUrl = canvas.toDataURL('image/jpeg');
    const base64Pure = dataUrl.split(',')[1];
    setImagePreview(dataUrl);
    setMimeType('image/jpeg');
    processImage(base64Pure, 'image/jpeg');
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formData.amount);
    if (!formData.description.trim() || isNaN(val) || val <= 0) {
      showToast('Campos Inválidos', 'Verifique o valor e a descrição antes de salvar.', 'warning');
      return;
    }

    const isCard = creditCards.some((c) => c.id === formData.accountOrCard);

    addTransaction({
      date: formData.date,
      description: formData.description.trim(),
      amount: val,
      type: formData.type,
      category: formData.category,
      paymentMethod: isCard ? 'cartao' : 'conta',
      accountId: isCard ? 'itau' : formData.accountOrCard,
      cardId: isCard ? formData.accountOrCard : undefined,
      status: formData.type === 'Receita' ? 'Recebido' : 'Pago',
      notes: formData.notes.trim() ? `[IA Scanner] ${formData.notes.trim()}` : '[Lançamento via Scanner IA]',
    });

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-space-lg shadow-2xl border border-surface-container flex flex-col gap-space-md">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">document_scanner</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Scanner Inteligente com IA
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-tertiary-fixed text-on-tertiary-fixed tracking-wide uppercase">
                  Gemini 3.8
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Envie a foto de um comprovante, cupom ou nota fiscal para preenchimento automático.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Upload Area / Image Preview */}
        {!imagePreview ? (
          <div className="flex flex-col gap-space-md">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-secondary/30 hover:border-secondary bg-surface-container-low/50 hover:bg-surface-container-low rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-container-lowest shadow-card flex items-center justify-center text-secondary group-hover:scale-110 transition-transform mb-3">
                <span className="material-symbols-outlined text-[32px]">photo_camera</span>
              </div>
              <span className="font-title-md text-title-md text-on-surface font-semibold">
                Tire uma foto ou selecione o comprovante
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-sm">
                Formatos suportados: PNG, JPG, JPEG, WEBP ou PDF (até 25MB)
              </span>

              <button
                type="button"
                className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-semibold hover:bg-inverse-surface shadow-xs transition-colors"
              >
                Procurar no Dispositivo
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Demo Samples */}
            <div className="p-3 bg-surface-container-low/60 rounded-xl border border-surface-container flex flex-col gap-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Testar Imediatamente com Amostras:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => loadDemoSample('restaurante')}
                  className="px-3 py-2 bg-surface-container-lowest hover:bg-surface-container text-on-surface text-left rounded-lg border border-surface-container text-body-sm flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">restaurant</span>
                  <span className="truncate">Almoço La Guapa</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadDemoSample('supermercado')}
                  className="px-3 py-2 bg-surface-container-lowest hover:bg-surface-container text-on-surface text-left rounded-lg border border-surface-container text-body-sm flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">shopping_cart</span>
                  <span className="truncate">Pão de Açúcar</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadDemoSample('pix')}
                  className="px-3 py-2 bg-surface-container-lowest hover:bg-surface-container text-on-surface text-left rounded-lg border border-surface-container text-body-sm flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">flash_on</span>
                  <span className="truncate">PIX Enel Energia</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-space-md">
            {/* Split Preview and Analysis Status */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-surface-container-low p-3 rounded-xl border border-surface-container">
              <div className="sm:col-span-3 h-28 max-w-[140px] rounded-lg overflow-hidden border border-surface-container bg-black/5 flex items-center justify-center">
                <img src={imagePreview} alt="Recibo" className="h-full w-full object-cover" />
              </div>
              <div className="sm:col-span-9 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      {isScanning ? 'sync' : 'verified'}
                    </span>
                    <span className="font-title-md text-title-md font-semibold text-on-surface">
                      {isScanning ? 'Lendo comprovante com IA...' : 'Dados Extraídos com Sucesso'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="font-label-sm text-label-sm text-secondary hover:underline cursor-pointer"
                  >
                    Trocar imagem
                  </button>
                </div>

                {isScanning ? (
                  <div className="my-2">
                    <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                      <span>Analisando estabelecimento, valores e CNPJ...</span>
                      <span className="animate-pulse">Aguarde...</span>
                    </div>
                    <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full animate-pulse w-3/4"></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-2 text-label-sm text-on-surface-variant">
                    {extractedData?.confidence !== undefined && (
                      <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                        Precisão da IA: {extractedData.confidence}%
                      </span>
                    )}
                    <span>Revise os dados abaixo antes de confirmar o lançamento.</span>
                  </div>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-error-container text-error rounded-xl text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Editable Form with Extracted Data */}
            <form onSubmit={handleSaveTransaction} className="flex flex-col gap-space-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                {/* Descrição */}
                <div className="sm:col-span-2">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold mb-1">
                    Estabelecimento / Favorecido *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2.5 text-body-md text-on-surface focus:outline-none focus:border-secondary font-medium"
                    placeholder="Ex: Restaurante La Guapa"
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold mb-1">
                    Valor (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-on-surface-variant font-medium">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-10 bg-surface-container-low border border-surface-container rounded-lg p-2.5 text-headline-md font-bold text-on-surface focus:outline-none focus:border-secondary"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                {/* Data */}
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold mb-1">
                    Data da Operação *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2.5 text-body-md text-on-surface focus:outline-none focus:border-secondary"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2.5 text-body-md text-on-surface focus:outline-none focus:border-secondary"
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Moradia">Moradia</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Saúde & Cuidados">Saúde &amp; Cuidados</option>
                    <option value="Lazer & Cultura">Lazer &amp; Cultura</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                {/* Conta ou Cartão de Pagamento */}
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold mb-1">
                    Conta de Liquidação / Cartão *
                  </label>
                  <select
                    value={formData.accountOrCard}
                    onChange={(e) => setFormData({ ...formData, accountOrCard: e.target.value })}
                    className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2.5 text-body-md text-on-surface focus:outline-none focus:border-secondary"
                  >
                    <optgroup label="Contas Bancárias">
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          Conta: {acc.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Cartões de Crédito">
                      {creditCards.map((card) => (
                        <option key={card.id} value={card.id}>
                          Cartão: {card.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Observações / Detalhes lidos pela IA */}
                <div className="sm:col-span-2">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold mb-1">
                    Observações / Itens Extraídos
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2 text-body-sm text-on-surface focus:outline-none focus:border-secondary"
                    placeholder="Itens identificados, CNPJ ou código de autenticação"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-inverse-surface shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>Confirmar &amp; Salvar Lançamento</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
