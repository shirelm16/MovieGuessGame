function HintCardShell({ emoji, label, children }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)] overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2">
        <span className="text-sm">{emoji}</span>
        <p className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold">{label}</p>
      </div>
      <div className="px-4 py-3">
        {children}
      </div>
    </div>
  );
}

export function HintCard({ type, answer }) {
  if (type === 'tagline') {
    return (
      <HintCardShell emoji="💬" label="Tagline">
        {answer.tagline ? (
          <p className="text-white italic text-sm">"{answer.tagline}"</p>
        ) : (
          <p className="text-slate-500 text-sm">No tagline available for this movie.</p>
        )}
      </HintCardShell>
    );
  }

  if (type === 'filmography') {
    return (
      <HintCardShell emoji="🎬" label="Filmography">
        <p className="text-slate-400 text-xs mb-3">The director of this film also made...</p>
        {answer.filmographyTitle ? (
          <div className="flex items-center gap-3">
            {answer.filmographyPoster ? (
              <img
                src={answer.filmographyPoster}
                alt={answer.filmographyTitle}
                className="w-12 h-[4.5rem] object-cover rounded flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-[4.5rem] bg-slate-700 rounded flex-shrink-0 flex items-center justify-center text-xl">🎬</div>
            )}
            <p className="text-white font-bold text-base uppercase tracking-wide leading-tight">
              {answer.filmographyTitle}
            </p>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No filmography data available.</p>
        )}
      </HintCardShell>
    );
  }

  if (type === 'actorPhoto') {
    return (
      <HintCardShell emoji="⭐" label="Lead Actor">
        <div className="flex items-center gap-4">
          {answer.leadActorPhoto ? (
            <img
              src={answer.leadActorPhoto}
              alt="Lead actor"
              className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-slate-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 text-2xl">🎭</div>
          )}
          <p className="text-slate-400 text-sm">The lead actor features in this movie.</p>
        </div>
      </HintCardShell>
    );
  }

  if (type === 'cast') {
    const actor = answer.cast?.[0];
    return (
      <HintCardShell emoji="🎭" label="Cast Member">
        <p className="text-slate-400 text-xs mb-2">One of the cast members is...</p>
        {actor ? (
          <p className="text-white font-bold text-base uppercase tracking-wide">{actor}</p>
        ) : (
          <p className="text-slate-500 text-sm">No cast data available.</p>
        )}
      </HintCardShell>
    );
  }

  if (type === 'runtime') {
    return (
      <HintCardShell emoji="⏱️" label="Runtime">
        {answer.runtime ? (
          <p className="text-white font-bold text-base">{answer.runtime} minutes</p>
        ) : (
          <p className="text-slate-500 text-sm">No runtime data available.</p>
        )}
      </HintCardShell>
    );
  }

  return null;
}
