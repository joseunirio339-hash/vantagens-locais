import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, Camera, CameraOff, Loader2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function QRScanner({ partner, onValidated }) {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, voucher, message }
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  const startScanner = async () => {
    setResult(null);
    setScanning(true);
  };

  const stopScanner = () => {
    if (html5QrcodeRef.current) {
      html5QrcodeRef.current.stop().catch(() => {});
      html5QrcodeRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    if (!scanning) return;

    const html5Qrcode = new Html5Qrcode('qr-reader');
    html5QrcodeRef.current = html5Qrcode;

    html5Qrcode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        html5Qrcode.stop().then(() => {
          html5QrcodeRef.current = null;
          setScanning(false);
          handleVoucherCode(decodedText.trim());
        });
      },
      () => {} // ignore scan errors
    ).catch((err) => {
      console.error(err);
      setScanning(false);
      toast.error('Não foi possível acessar a câmera. Verifique as permissões.');
    });

    return () => {
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop().catch(() => {});
        html5QrcodeRef.current = null;
      }
    };
  }, [scanning]);

  const handleVoucherCode = async (code) => {
    setLoading(true);
    try {
      const vouchers = await base44.entities.Voucher.filter({ code });

      if (vouchers.length === 0) {
        setResult({ success: false, message: 'Voucher não encontrado.' });
        setLoading(false);
        return;
      }

      const voucher = vouchers[0];

      if (voucher.partner_id !== partner.id) {
        setResult({ success: false, message: 'Este voucher não pertence ao seu estabelecimento.' });
        setLoading(false);
        return;
      }

      if (voucher.status === 'used') {
        setResult({ success: false, voucher, message: 'Voucher já foi utilizado.' });
        setLoading(false);
        return;
      }

      if (voucher.status === 'expired') {
        setResult({ success: false, voucher, message: 'Voucher expirado.' });
        setLoading(false);
        return;
      }

      // Validate voucher
      await base44.entities.Voucher.update(voucher.id, {
        status: 'used',
        used_at: new Date().toISOString()
      });

      await base44.entities.Notification.create({
        partner_id: partner.id,
        type: 'voucher_used',
        title: '✅ Voucher Validado via QR Code!',
        message: `Voucher ${voucher.code} para "${voucher.product_name}" foi validado com sucesso via QR Code.`,
        is_read: false,
        reference_id: voucher.id
      });

      // E-mail para o parceiro (voucher usado)
      if (partner?.owner_email) {
        base44.functions.invoke('sendEmailNotification', {
          type: 'voucher_used',
          data: {
            partner_email: partner.owner_email,
            partner_name: partner.business_name,
            voucher_code: voucher.code,
            user_name: voucher.user_name || 'Não informado',
            product_name: voucher.product_name,
            discount_price: voucher.discount_price?.toFixed(2).replace('.', ',')
          }
        });
      }

      setResult({ success: true, voucher, message: 'Voucher validado com sucesso!' });
      toast.success('✅ Voucher validado!');
      if (onValidated) onValidated();
    } catch (e) {
      setResult({ success: false, message: 'Erro ao validar voucher. Tente novamente.' });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-emerald-600" />
          Leitor de QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner area */}
        <div className="relative">
          <div
            id="qr-reader"
            className={`w-full rounded-2xl overflow-hidden bg-slate-900 ${scanning ? 'block' : 'hidden'}`}
            style={{ minHeight: 300 }}
          />
          {!scanning && !loading && (
            <div className="flex flex-col items-center justify-center bg-slate-100 rounded-2xl p-10 gap-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <QrCode className="w-10 h-10 text-emerald-600" />
              </div>
              <p className="text-slate-500 text-sm text-center">
                Aponte a câmera para o QR Code do voucher do cliente
              </p>
              <Button onClick={startScanner} className="bg-emerald-600 hover:bg-emerald-700">
                <Camera className="w-4 h-4 mr-2" />
                Iniciar Câmera
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center bg-slate-100 rounded-2xl p-10 gap-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-slate-500 text-sm">Validando voucher...</p>
            </div>
          )}
        </div>

        {/* Stop button while scanning */}
        {scanning && (
          <Button variant="outline" onClick={stopScanner} className="w-full text-red-600 border-red-300 hover:bg-red-50">
            <CameraOff className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-2xl p-5 border-2 ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              {result.success
                ? <CheckCircle className="w-6 h-6 text-emerald-600" />
                : <XCircle className="w-6 h-6 text-red-500" />
              }
              <span className={`font-semibold text-lg ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                {result.message}
              </span>
            </div>
            {result.voucher && (
              <div className="space-y-1 text-sm">
                <p><span className="font-medium text-slate-600">Código:</span> <span className="font-mono font-bold">{result.voucher.code}</span></p>
                <p><span className="font-medium text-slate-600">Produto:</span> {result.voucher.product_name}</p>
                {result.voucher.user_name && <p><span className="font-medium text-slate-600">Cliente:</span> {result.voucher.user_name}</p>}
                <p><span className="font-medium text-slate-600">Valor:</span> <span className="text-emerald-600 font-semibold">R$ {result.voucher.discount_price?.toFixed(2).replace('.', ',')}</span></p>
              </div>
            )}
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() => { setResult(null); startScanner(); }}
            >
              <QrCode className="w-4 h-4 mr-2" />
              Escanear Novo Voucher
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}