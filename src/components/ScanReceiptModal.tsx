import React, { useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { parseCurrencyInput } from '../utils/currency';

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
    accountOrCard: accounts[0]?.id || creditCards[0]?.id || '',
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
      accountOrCard: accounts[0]?.id || creditCards[0]?.id || '',
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
      let matchedAcc = '';
      if (data.suggestedAccountOrCard && (accounts.some((a) => a.id === data.suggestedAccountOrCard) || creditCards.some((card) => card.id === data.suggestedAccountOrCard))) {
        matchedAcc = data.suggestedAccountOrCard;
      } else if (data.paymentMethod === 'cartao' && creditCards.length > 0) {
        matchedAcc = creditCards[0].id;
      } else if (accounts.length > 0) {
        matchedAcc = accounts[0].id;
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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Formato não suportado. Envie JPG, PNG, WEBP ou PDF.');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('O arquivo excede o limite de 10 MB. Escolha um arquivo menor.');
      e.target.value = '';
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

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseCurrencyInput(formData.amount);
    if (!formData.description.trim() || isNaN(val) || val <= 0) {
      showToast('Campos Inválidos', 'Verifique o valor e a descrição antes de salvar.', 'warning');
      return;
    }

    const selectedCard = creditCards.find((card) => card.id === formData.accountOrCard);
    const isCard = Boolean(selectedCard);
    const linkedAccount = selectedCard ? accounts.find((account) => account.id === selectedCard.linkedAccountId) : accounts.find((account) => account.id === formData.accountOrCard);
    if (!linkedAccount) {
      showToast('Conta necessária', 'Cadastre uma conta bancária ou vincule o cartão a uma conta existente antes de registrar o comprovante.', 'warning');
      return;
    }

    addTransaction({
      date: formData.date,
      description: formData.description.trim(),
      amount: val,
      type: formData.type,
      category: formData.category,
      paymentMethod: isCard ? 'cartao' : 'conta',
      accountId: linkedAccount.id,
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
                Formatos suportados: JPG, PNG, WEBP ou PDF (até 10 MB)
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
                accept="image/jpeg,image/png,image/webp,application/pdf"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
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
      </div>
    </div>
  );
};
