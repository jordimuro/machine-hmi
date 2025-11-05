import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, Plus, Minus, RefreshCw, CheckSquare, Square } from 'lucide-react';
import apiClient from '../services/apiClient';

export default function VariableScanner({ isOpen, onClose, onVariablesSelected }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [availableNodes, setAvailableNodes] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [error, setError] = useState('');
  const [scanType, setScanType] = useState('application'); // 'application', 'general', 'variables'
  const [currentPath, setCurrentPath] = useState('RootFolder');

  // Filtrar y ordenar nodos basado en el término de búsqueda
  const filteredNodes = availableNodes
    .filter(node =>
      node.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.nodeId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Primero ordenar por si es elemento de array
      if (a.isArrayElement && !b.isArrayElement) return 1;
      if (!a.isArrayElement && b.isArrayElement) return -1;
      
      // Si ambos son elementos de array, ordenar por índice
      if (a.isArrayElement && b.isArrayElement) {
        if (a.parentArray === b.parentArray) {
          return (a.arrayIndex || 0) - (b.arrayIndex || 0);
        }
        return a.parentArray.localeCompare(b.parentArray);
      }
      
      // Ordenar alfabéticamente por nombre
      return a.displayName.localeCompare(b.displayName);
    });

  // Escanear variables del servidor OPC UA
  const scanVariables = async (nodeId = null, type = scanType) => {
    setScanning(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        type: type,
        recursive: 'true',
        maxDepth: type === 'application' ? '5' : '3'
      });
      
      if (nodeId) {
        params.append('nodeId', nodeId);
      }
      
      const response = await apiClient.request(`/cmd/browse?${params}`, {
        method: 'GET'
      });
      
      if (response.nodes && response.nodes.length > 0) {
        setAvailableNodes(response.nodes);
        setCurrentPath(nodeId || 'RootFolder');
      } else if (response.error) {
        // Si hay error de conexión, mostrar variables simuladas basadas en el XML
        const simulatedNodes = generateSimulatedNodes();
        setAvailableNodes(simulatedNodes);
        setError('Conexión OPC UA perdida. Mostrando variables simuladas basadas en configuración.');
      } else {
        setError('No se encontraron variables en el servidor OPC UA');
      }
    } catch (err) {
      // En caso de error, mostrar variables simuladas
      const simulatedNodes = generateSimulatedNodes();
      setAvailableNodes(simulatedNodes);
      setError(`Error de conexión: ${err.message}. Mostrando variables simuladas.`);
    } finally {
      setScanning(false);
    }
  };

  // Explorar un nodo específico
  const exploreNode = async (nodeId) => {
    await scanVariables(nodeId, 'variables');
  };

  // Generar nodos simulados basados en el XML de CODESYS
  const generateSimulatedNodes = () => {
    const baseNodes = [
      {
        nodeId: 'ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.GVL.lrActualSpeed',
        displayName: 'lrActualSpeed',
        dataType: 'LREAL',
        isVariable: true,
        accessible: true,
        description: 'Velocidad actual de la máquina'
      }
    ];

    // Agregar array de valores aleatorios
    for (let i = 1; i <= 20; i++) {
      baseNodes.push({
        nodeId: `ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.GVL.RandomValues[${i}]`,
        displayName: `RandomValues[${i}]`,
        dataType: 'LREAL',
        isVariable: true,
        accessible: true,
        description: `Valor aleatorio ${i}`
      });
    }

    // Agregar algunas variables adicionales simuladas
    const additionalVars = [
      { name: 'Temperature_Zone1', type: 'REAL', desc: 'Temperatura zona 1' },
      { name: 'Temperature_Zone2', type: 'REAL', desc: 'Temperatura zona 2' },
      { name: 'Pressure_Main', type: 'REAL', desc: 'Presión principal' },
      { name: 'Motor_Running', type: 'BOOL', desc: 'Estado motor' },
      { name: 'Production_Counter', type: 'DINT', desc: 'Contador producción' },
      { name: 'Alarm_Temperature', type: 'BOOL', desc: 'Alarma temperatura' },
      { name: 'Alarm_Pressure', type: 'BOOL', desc: 'Alarma presión' },
      { name: 'Setpoint_Speed', type: 'REAL', desc: 'Consigna velocidad' },
      { name: 'Flow_Rate', type: 'REAL', desc: 'Caudal' },
      { name: 'Vibration_Level', type: 'REAL', desc: 'Nivel vibración' }
    ];

    additionalVars.forEach((variable, index) => {
      baseNodes.push({
        nodeId: `ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.GVL.${variable.name}`,
        displayName: variable.name,
        dataType: variable.type,
        isVariable: true,
        accessible: true,
        description: variable.desc
      });
    });

    return baseNodes;
  };

  // Alternar selección de nodo
  const toggleNodeSelection = (nodeId) => {
    const newSelected = new Set(selectedNodes);
    if (newSelected.has(nodeId)) {
      newSelected.delete(nodeId);
    } else {
      newSelected.add(nodeId);
    }
    setSelectedNodes(newSelected);
  };

  // Seleccionar/deseleccionar todos los nodos filtrados
  const toggleAllNodes = () => {
    const newSelected = new Set(selectedNodes);
    const allFilteredSelected = filteredNodes.every(node => selectedNodes.has(node.nodeId));
    
    if (allFilteredSelected) {
      // Deseleccionar todos los filtrados
      filteredNodes.forEach(node => newSelected.delete(node.nodeId));
    } else {
      // Seleccionar todos los filtrados
      filteredNodes.forEach(node => newSelected.add(node.nodeId));
    }
    
    setSelectedNodes(newSelected);
  };

  // Aplicar selección
  const applySelection = async () => {
    const selectedVariables = availableNodes.filter(node => 
      selectedNodes.has(node.nodeId)
    );
    
    setLoading(true);
    try {
      const response = await apiClient.request('/cmd/add-variables', {
        method: 'POST',
        body: JSON.stringify({ variables: selectedVariables }),
      });
      
      if (response.success) {
        onVariablesSelected(selectedVariables);
        onClose();
        // Mostrar mensaje de éxito
        alert(`${response.totalAdded} variables añadidas exitosamente`);
      } else {
        setError('Error al añadir variables');
      }
    } catch (err) {
      setError(`Error al añadir variables: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Escanear automáticamente al abrir
  useEffect(() => {
    if (isOpen && availableNodes.length === 0) {
      scanVariables();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('variableScanner.title')}
            </h2>
            <p className="text-gray-600 mt-1">
              {t('variableScanner.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <select
                value={scanType}
                onChange={(e) => setScanType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="application">{t('variableScanner.applicationVariables')}</option>
                <option value="variables">{t('variableScanner.variablesOnly')}</option>
                <option value="general">{t('variableScanner.generalExploration')}</option>
              </select>
              
              <button
                onClick={() => scanVariables()}
                disabled={scanning}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? t('variableScanner.scanning') : t('variableScanner.scan')}
              </button>
            </div>
            
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('variableScanner.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Current Path */}
          {currentPath !== 'RootFolder' && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{t('variableScanner.currentPath')}:</span> {currentPath}
            </div>
          )}

          {filteredNodes.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t('variableScanner.foundVariables', { count: filteredNodes.length })}
              </span>
              <button
                onClick={toggleAllNodes}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                {filteredNodes.every(node => selectedNodes.has(node.nodeId)) ? (
                  <>
                    <Minus className="w-4 h-4" />
                    {t('variableScanner.deselectAll')}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {t('variableScanner.selectAll')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Variables List */}
        <div className="flex-1 overflow-auto p-6">
          {scanning ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                <p className="text-gray-600">{t('variableScanner.scanningMessage')}</p>
              </div>
            </div>
          ) : filteredNodes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('variableScanner.noVariables')}</p>
              <button
                onClick={scanVariables}
                className="mt-4 btn-secondary"
              >
                {t('variableScanner.startScan')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNodes.map((node) => (
                <div
                  key={node.nodeId}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleNodeSelection(node.nodeId)}
                >
                  <div className="flex-shrink-0">
                    {selectedNodes.has(node.nodeId) ? (
                      <CheckSquare className="w-5 h-5 text-primary-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium truncate ${
                        node.isArrayElement ? 'text-blue-900 ml-4' : 'text-gray-900'
                      }`}>
                        {node.isArrayElement && '└─ '}
                        {node.displayName}
                      </h4>
                      {node.dataType && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {node.dataType}
                        </span>
                      )}
                      {node.isArrayElement && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          Array[{node.arrayIndex}]
                        </span>
                      )}
                      {node.accessible === false && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          {t('variableScanner.notAccessible')}
                        </span>
                      )}
                      {node.depth !== undefined && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {t('variableScanner.level')} {node.depth}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${
                      node.isArrayElement ? 'text-blue-500 ml-4' : 'text-gray-500'
                    }`}>
                      {node.nodeId}
                    </p>
                    {node.parentArray && (
                      <p className="text-xs text-purple-600 ml-4">
                        {t('variableScanner.elementOf')}: {node.parentArray}
                      </p>
                    )}
                    {node.path && !node.isArrayElement && (
                      <p className="text-xs text-gray-400 truncate">
                        {t('variableScanner.path')}: {node.path}
                      </p>
                    )}
                    {node.value !== undefined && (
                      <p className={`text-xs text-green-600 ${
                        node.isArrayElement ? 'ml-4' : ''
                      }`}>
                        {t('variableScanner.currentValue')}: {String(node.value)}
                      </p>
                    )}
                  </div>

                  {/* Botón para explorar si es un objeto */}
                  {node.isObject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exploreNode(node.nodeId);
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      {t('variableScanner.explore')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedNodes.size > 0 && (
              <span>
                {t('variableScanner.selectedCount', { count: selectedNodes.size })}
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={applySelection}
              disabled={selectedNodes.size === 0 || loading}
              className="btn-primary"
            >
              {loading ? t('common.loading') : t('variableScanner.addSelected')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}