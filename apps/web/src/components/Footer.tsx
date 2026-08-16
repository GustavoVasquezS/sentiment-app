import { useState } from "react";

interface TeamMember {
  name: string;
  role: string;
}

const teamMembers: TeamMember[] = [
  { name: "Gustavo Vásquez", role: "Data Scientist" },
  { name: "Jonathan Tuppia", role: "Backend Developer" },
  { name: "Alexandra Cleto", role: "Frontend Developer" },
  { name: "Francisco Lledo", role: "Data Scientist" },
  { name: "Johan Cuellar", role: "Data Scientist" },
];

function Footer() {
  const [showTeam, setShowTeam] = useState(false);
  const [showOne, setShowOne] = useState(false);

  return (
    <>
      <footer className="w-full border-t border-white/10 bg-slate-900/80 backdrop-blur-sm py-4 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sm text-slate-400">
          <span>Equipo</span>
          <button
            onClick={() => setShowTeam(true)}
            className="font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer underline decoration-dotted underline-offset-4"
          >
            No Data-No Code
          </button>
          <span>en Hackaton</span>
          <button
            onClick={() => setShowOne(true)}
            className="font-semibold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer underline decoration-dotted underline-offset-4"
          >
            ONE
          </button>
          <span>—</span>
          <a
            href="https://nocountry.tech/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors underline decoration-dotted underline-offset-4"
          >
            No Country
          </a>
        </div>
      </footer>

      {/* Modal: Integrantes del equipo */}
      {showTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowTeam(false)}
        >
          <div
            className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-1 text-center">Equipo No Data-No Code</h3>
            <p className="text-slate-400 text-sm text-center mb-5">Hackaton ONE — No Country</p>
            <div className="space-y-3">
              {teamMembers.map((member, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-700/50 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{member.name}</p>
                    <p className="text-slate-400 text-xs">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowTeam(false)}
              className="mt-5 w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: ONE — Oracle Next Education */}
      {showOne && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowOne(false)}
        >
          <div
            className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">ONE — Oracle Next Education</h3>
            <div className="space-y-3">
              <a
                href="https://www.oracle.com/latam/education/oracle-next-education/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl px-4 py-4 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  O
                </div>
                <div>
                  <p className="text-white font-medium group-hover:text-orange-300 transition-colors">Oracle Next Education</p>
                  <p className="text-slate-400 text-xs">Programa educativo de Oracle</p>
                </div>
                <svg className="w-4 h-4 text-slate-500 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a
                href="https://www.aluracursos.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl px-4 py-4 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  A
                </div>
                <div>
                  <p className="text-white font-medium group-hover:text-cyan-300 transition-colors">Alura Latam</p>
                  <p className="text-slate-400 text-xs">Academia que imparte el programa ONE</p>
                </div>
                <svg className="w-4 h-4 text-slate-500 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <button
              onClick={() => setShowOne(false)}
              className="mt-5 w-full py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Footer;
