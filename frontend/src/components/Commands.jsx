import { useState } from 'react';
import apiClient from '../services/apiClient';
import { Play, Square, AlertOctagon, Settings, CheckCircle, XCircle } from 'lucide-react';

function ConfirmModal({ isOpen, onClose, onConfirm, command }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Action</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to execute command: <strong>{command}</strong>?
        </p>
        <div className="flex gap-4">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-primary flex-1">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function SetpointModal({ isOpen, onClose, onConfirm }) {
  const [value, setValue] = useState('');

  const handleConfirm = () => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 3000) {
      onConfirm(numValue);
      setValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Set Speed Setpoint</h3>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Speed (RPM)
          </label>
          <input
            type="number"
            min="0"
            max="3000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-3 text-2xl border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
            placeholder="0 - 3000"
            autoFocus
          />
          <p className="text-sm text-gray-500 mt-2">Valid range: 0 - 3000 RPM</p>
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn-primary flex-1"
            disabled={!value || parseFloat(value) < 0 || parseFloat(value) > 3000}
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultMessage({ result }) {
  if (!result) return null;

  const isSuccess = result.success;

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg ${
        isSuccess ? 'bg-success-50 text-success-800' : 'bg-danger-50 text-danger-800'
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="w-6 h-6" />
      ) : (
        <XCircle className="w-6 h-6" />
      )}
      <div className="flex-1">
        <p className="font-semibold">
          {isSuccess ? 'Command Executed' : 'Command Failed'}
        </p>
        <p className="text-sm">{result.message}</p>
      </div>
    </div>
  );
}

export default function Commands() {
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, command: null });
  const [setpointModal, setSetpointModal] = useState(false);
  const [result, setResult] = useState(null);

  const executeCommand = async (command, params = {}) => {
    setLoading(true);
    setResult(null);

    try {
      await apiClient.executeCommand(command, params);
      setResult({
        success: true,
        message: `Command "${command}" executed successfully`,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error.message || 'Failed to execute command',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCommandClick = (command) => {
    setConfirmModal({ isOpen: true, command });
  };

  const handleConfirm = () => {
    const { command } = confirmModal;
    setConfirmModal({ isOpen: false, command: null });
    executeCommand(command);
  };

  const handleSetpointConfirm = (value) => {
    setSetpointModal(false);
    executeCommand('SET_SETPOINT', { tag: 'SetpointSpeed', value });
  };

  const commands = [
    {
      id: 'START',
      label: 'Start Machine',
      icon: Play,
      color: 'btn-success',
      description: 'Start the machine operation',
    },
    {
      id: 'STOP',
      label: 'Stop Machine',
      icon: Square,
      color: 'btn-danger',
      description: 'Stop the machine operation',
    },
    {
      id: 'RESET_ALARMS',
      label: 'Reset Alarms',
      icon: AlertOctagon,
      color: 'btn-secondary',
      description: 'Clear all active alarms',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Machine Commands</h2>
        <p className="text-gray-600">Execute control commands (Maintenance only)</p>
      </div>

      {result && (
        <div className="mb-6">
          <ResultMessage result={result} />
        </div>
      )}

      {/* Commands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {commands.map((cmd) => {
          const Icon = cmd.icon;
          return (
            <button
              key={cmd.id}
              onClick={() => handleCommandClick(cmd.id)}
              disabled={loading}
              className={`${cmd.color} flex items-center gap-4 h-auto py-8 px-6 text-left`}
            >
              <Icon className="w-8 h-8" />
              <div className="flex-1">
                <div className="text-xl font-bold mb-1">{cmd.label}</div>
                <div className="text-sm opacity-90">{cmd.description}</div>
              </div>
            </button>
          );
        })}

        {/* Setpoint Command */}
        <button
          onClick={() => setSetpointModal(true)}
          disabled={loading}
          className="btn-primary flex items-center gap-4 h-auto py-8 px-6 text-left"
        >
          <Settings className="w-8 h-8" />
          <div className="flex-1">
            <div className="text-xl font-bold mb-1">Set Speed</div>
            <div className="text-sm opacity-90">Adjust machine speed setpoint</div>
          </div>
        </button>
      </div>

      {/* Safety Warning */}
      <div className="card bg-warning-50 border-2 border-warning-300">
        <div className="flex items-start gap-3">
          <AlertOctagon className="w-6 h-6 text-warning-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-warning-900 mb-2">Safety Notice</h3>
            <p className="text-warning-800 text-sm">
              Only execute commands when it is safe to do so. Ensure proper safety protocols
              are followed and all personnel are clear of the machine before starting operations.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, command: null })}
        onConfirm={handleConfirm}
        command={confirmModal.command}
      />

      <SetpointModal
        isOpen={setpointModal}
        onClose={() => setSetpointModal(false)}
        onConfirm={handleSetpointConfirm}
      />
    </div>
  );
}
