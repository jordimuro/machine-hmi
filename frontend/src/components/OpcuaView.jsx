import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Search } from 'lucide-react';
import VariableScanner from './VariableScanner';

export default function OpcuaView() {
  const { data, isConnected } = useWebSocket();
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (data?.opcua) {
      setConnectionStatus(data.opcua.connected ? 'Conectado' : 'Desconectado');
    }
  }, [data]);

  const handleVariablesSelected = (selectedVariables) => {
    console.log('Variables seleccionadas:', selectedVariables);
    // Aquí se podría implementar la lógica para agregar las variables al sistema
    // Por ejemplo, enviar una petición al backend para actualizar la configuración
  };

  const tags = data?.tags || {};
  const opcuaInfo = data?.opcua || {};

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Estado OPC UA</h2>
        
        {/* Botón de explorador de variables */}
        <div className="mb-6">
          <button
            onClick={() => setShowScanner(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Explorar Variables OPC UA
          </button>
        </div>

        {/* Estado de conexión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Estado de Conexión</h3>
            <div className="flex items-center mt-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-lg font-semibold">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Endpoint</h3>
            <p className="text-lg font-semibold mt-2 break-all">
              opc.tcp://192.168.68.100:4840
            </p>
          </div>
        </div>

        {/* Lista de tags */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags OPC UA</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(tags).map(([tagName, tagData]) => (
                  <tr key={tagName}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tagName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tagData.value !== null && tagData.value !== undefined 
                        ? tagData.value.toString() 
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tagData.dataType || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tagData.quality === 'Good' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tagData.quality || 'Bad'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tagData.timestamp 
                        ? new Date(tagData.timestamp).toLocaleString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Información adicional */}
        {opcuaInfo.lastError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800">Último Error</h4>
            <p className="text-sm text-red-700 mt-1">{opcuaInfo.lastError}</p>
          </div>
        )}
      </div>

      {/* Variable Scanner Modal */}
      <VariableScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onVariablesSelected={handleVariablesSelected}
      />
    </div>
  );
}