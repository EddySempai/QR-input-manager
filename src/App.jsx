import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from './supabaseClient';
import './App.css'; // Asegúrate de tener estilos básicos o usar Tailwind

function App() {
  const [mensaje, setMensaje] = useState('Apunta al código QR de la entrada');
  const [estado, setEstado] = useState('idle'); // idle, success, error, warning
  const [escaneando, setEscaneando] = useState(true);

  const handleScan = async (rawText) => {
    // Limpiar espacios en blanco o saltos de linea invisibles
    const textoEscaneado = rawText ? rawText.trim() : '';

    // Evitar escaneos múltiples mientras procesa uno
    if (!textoEscaneado || !escaneando) return;

    setEscaneando(false);
    setEstado('idle');
    setMensaje('Validando entrada...');

    try {
      // 1. Buscar la entrada en la tabla por el ID del QR
      const { data, error } = await supabase
        .from('entradas')
        .select('*')
        .eq('id', textoEscaneado)
        .single();

      // 2. Lógica de validación
      if (error || !data) {
        console.error('Error de Supabase o no hay datos:', error);
        setEstado('error');
        setMensaje(`❌ QR Inválido.`);
      } else if (data.validada) {
        setEstado('warning');
        setMensaje(`⚠️ ¡CUIDADO! Esta entrada ya fue utilizada por: ${data.nombre}`);
      } else {
        // 3. Marcar la entrada como validada en Supabase
        const { error: updateError } = await supabase
          .from('entradas')
          .update({ validada: true })
          .eq('id', textoEscaneado);

        if (updateError) throw updateError;

        setEstado('success');
        setMensaje(`✅ ¡Acceso Permitido! Bienvenido/a, ${data.nombre}`);
      }
    } catch (err) {
      console.error(err);
      setEstado('error');
      setMensaje('Error de conexión con la base de datos.');
    }

    // 4. Reiniciar el escáner después de 3.5 segundos para la siguiente persona
    setTimeout(() => {
      setMensaje('Apunta al código QR de la entrada');
      setEstado('idle');
      setEscaneando(true);
    }, 3500);
  };

  // Colores dinámicos para la interfaz según el estado
  const getBackgroundColor = () => {
    if (estado === 'success') return '#4ade80'; // Verde
    if (estado === 'error') return '#f87171'; // Rojo
    if (estado === 'warning') return '#fbbf24'; // Amarillo/Naranja
    return '#f3f4f6'; // Gris por defecto
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', backgroundColor: '#1f2937', padding: '20px', fontFamily: 'sans-serif' }}>

      <h1 style={{ color: 'white', textAlign: 'center' }}>Control de Acceso</h1>
      <h2 style={{ color: '#9ca3af', textAlign: 'center', fontSize: '16px' }}>I Seminario UNESR</h2>

      <div style={{ width: '100%', maxWidth: '400px', margin: '20px 0', borderRadius: '15px', overflow: 'hidden', border: '4px solid #374151' }}>
        {/* El componente del escáner */}
        {escaneando ? (
          <Scanner
            onScan={(detectedCodes) => {
              if (detectedCodes && detectedCodes.length > 0) {
                handleScan(detectedCodes[0].rawValue);
              }
            }}
          />
        ) : (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff' }}>
            Procesando...
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: getBackgroundColor(),
        padding: '20px',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '18px',
        color: estado === 'idle' ? '#374151' : '#fff',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {mensaje}
      </div>

    </div>
  );
}

export default App;