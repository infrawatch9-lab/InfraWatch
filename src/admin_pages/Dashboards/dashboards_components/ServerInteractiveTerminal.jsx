import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function InteractiveTerminal({ className = "" }) {
  const { t } = useTranslation();
  const [terminalCommand, setTerminalCommand] = useState("");
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [terminalHistory, setTerminalHistory] = useState([]);

  useEffect(() => {
    const initialTerminalOutput = [
      { type: "info", text: t('server.terminal.service_restarted') },
      { type: "warn", text: t('server.terminal.high_cpu') },
      { type: "error", text: t('server.terminal.elasticsearch_failed') },
      { type: "info", text: t('server.terminal.backup_completed') },
      { type: "info", text: t('server.terminal.mysql_query') },
    ];
    setTerminalOutput(initialTerminalOutput);
  }, [t]);

  const handleTerminalCommand = (e) => {
    if (e.key === "Enter" && terminalCommand.trim()) {
      const command = terminalCommand.trim();
      const timestamp = new Date().toLocaleString();

      setTerminalHistory((prev) => [...prev, command]);

      const commandOutput = { type: "command", text: `username % ${command}` };

      let response = "";
      switch (command.toLowerCase()) {
        case t('server.terminal.services_status'):
          response = `+-------------------------+----------+----------+----------+
| name                    | port     | host     | status   |
+-------------------------+----------+----------+----------+
| nginx                   | 80       | 127.0.0.1| active   |
| mysql                   | 3306     | 127.0.0.1| active   |
| redis                   | 6379     | 127.0.0.1| active   |
| postgresql              | 5432     | 127.0.0.1| active   |
| elasticsearch           | 9200     | 127.0.0.1| failed   |
| docker                  | 2375     | 127.0.0.1| active   |
| ftp                     | 21       | 127.0.0.1| inactive |
+-------------------------+----------+----------+----------+`;
          break;
        case t('server.terminal.logs_all'):
          response = `[${timestamp}] [INFO] System monitoring active
[${timestamp}] [WARN] Disk usage at 78%
[${timestamp}] [INFO] API endpoint /health responded in 120ms`;
          break;
        case t('server.terminal.help'):
          response = `${t('server.terminal.available_commands')}
- ${t('server.terminal.cmd_services_status')}
- ${t('server.terminal.cmd_logs_all')}
- ${t('server.terminal.cmd_clear')}
- ${t('server.terminal.cmd_system_info')}
- ${t('server.terminal.cmd_restart')}`;
          break;
        case t('server.terminal.clear'):
          setTerminalOutput([]);
          setTerminalCommand("");
          return;
        case t('server.terminal.system_info'):
          response = `System Information:
OS: Ubuntu 20.04 LTS
CPU: Intel i7-8700K @ 3.70GHz
Memory: 16GB RAM (8.2GB used)
Disk: 512GB SSD (389GB free)
Uptime: 2 days, 14 hours, 23 minutes`;
          break;
        default:
          response = `bash: ${command}: command not found. Type 'help' for available commands.`;
      }

      const responseOutput = { type: "output", text: response };
      setTerminalOutput((prev) => [...prev, commandOutput, responseOutput]);
      setTerminalCommand("");

      setTimeout(() => {
        const el = document.getElementById("terminal-output");
        if (el) el.scrollTop = el.scrollHeight;
      }, 100);
    }
  };

  return (
    <div className={`bg-[#010E37] rounded-lg p-6 border border-[#3B5B75] ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm font-mono text-gray-300 ml-4">
            username@apache2_watch — 1548 x 48
          </span>
        </div>
        <button
          onClick={() => setTerminalOutput([])}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="bg-[#0E1A3D] rounded border border-[#3B5B75] p-4">
        {/* Output */}
        <div
          id="terminal-output"
          className="h-80 overflow-y-auto font-mono text-sm text-gray-300 mb-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#3B5B75 transparent" }}
        >
          {terminalOutput.map((line, index) => (
            <div key={index} className="mb-1">
              {line.type === "command" ? (
                <div className="text-green-400">{line.text}</div>
              ) : line.type === "info" ? (
                <div>
                  <span className="text-blue-400">[INFO]</span>{" "}
                  {line.text.replace(/\[INFO\]/g, "")}
                </div>
              ) : line.type === "warn" ? (
                <div>
                  <span className="text-yellow-400">[WARN]</span>{" "}
                  {line.text.replace(/\[WARN\]/g, "")}
                </div>
              ) : line.type === "error" ? (
                <div>
                  <span className="text-red-400">[ERROR]</span>{" "}
                  {line.text.replace(/\[ERROR\]/g, "")}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-gray-300">{line.text}</pre>
              )}
            </div>
          ))}
        </div>

        {/* Prompt */}
        <div className="flex items-center space-x-2">
          <span className="text-green-400 font-mono">username %</span>
          <input
            type="text"
            value={terminalCommand}
            onChange={(e) => setTerminalCommand(e.target.value)}
            onKeyPress={handleTerminalCommand}
            className="flex-1 bg-transparent text-gray-300 font-mono outline-none border-none"
            placeholder="Type a command (try 'services status' or 'help')"
            autoFocus
          />
        </div>
      </div>

      {/* Quick Commands */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          t('server.terminal.services_status'),
          t('server.terminal.logs_all'),
          t('server.terminal.system_info'),
          t('server.terminal.help'),
        ].map((cmd) => (
          <button
            key={cmd}
            onClick={() => {
              setTerminalCommand(cmd);
              handleTerminalCommand({ key: "Enter" });
            }}
            className="px-3 py-1 bg-[#0E1A3D] border border-[#3B5B75] text-gray-300 rounded text-xs hover:bg-[#3B5B75] transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
