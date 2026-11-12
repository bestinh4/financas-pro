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
