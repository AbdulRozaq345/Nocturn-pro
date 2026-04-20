const fs = require('fs');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// We need to fetch playlists in page.tsx if not fetched?
// Or we can just import from global context/api? Let's add a state in page.tsx for playlists.
// But we actually only need the user's playlists from the API!

let imports = `
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    const fetchSidebarPlaylists = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // Skip fetching if not authenticated

      try {
        const res = await api.get("/api/playlists");
        const data = res.data.data || res.data;
        setPlaylists(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err.response?.status !== 401) {
          console.error("Gagal sinkron playlist rekomendasi! í·¿");
        }
      }
    };
    fetchSidebarPlaylists();
  }, []);
`;

// Insert after `const { tracks, ... } = usePlayer();`
page = page.replace(
  '  } = usePlayer();\n',
  '  } = usePlayer();\n' + imports
);


const rekomendasiHTML = `
          {/* Recommendations Section */}
          <section className="py-4">
            <div className="flex justify-between items-center px-5 mb-5">
              <h2 className="text-lg font-bold tracking-tight text-white uppercase relative">
                Playlist Kamu
                <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-[#72fe8f]/50"></span>
              </h2>
              <button className="text-[10px] font-mono text-[#72fe8f] tracking-widest uppercase hover:underline">View All</button>
            </div>

            <div className="flex gap-4 overflow-x-auto px-5 pb-4 [&::-webkit-scrollbar]:hidden snap-x">
              {playlists.length > 0 ? (
                playlists.slice(0, 3).map((p) => (
                  <a href={\`/playlist/\${p.id}\`} key={p.id} className="snap-start flex-shrink-0 w-36 group cursor-pointer relative block">
                    <div className="w-36 h-36 bg-[#141414] rounded-xl overflow-hidden mb-3 relative shadow-lg flex items-center justify-center border border-white/5 group-hover:border-[#72fe8f]/50 transition-colors">
                      {p.cover_url ? (
                        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={p.cover_url} alt="Cover" />
                      ) : (
                        <span className="material-symbols-outlined text-4xl text-white/20">queue_music</span>
                      )}
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#72fe8f]/90 flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          <span className="material-symbols-outlined text-black text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col px-1">
                      <span className="text-sm font-semibold text-white truncate">{p.name || 'Unknown Playlist'}</span>
                      <span className="text-[10px] font-mono text-[#a1a1aa] mt-1 uppercase">PLAYLIST</span>
                    </div>
                  </a>
                ))
              ) : (
                 <div className="w-full flex items-center justify-center py-6">
                    <span className="text-xs font-mono text-[#a1a1aa] uppercase tracking-widest px-4 py-2 border border-white/10 rounded-full bg-white/5">
                      No Playlist
                    </span>
                 </div>
              )}
            </div>
          </section>`;

const regex = /\{\/\* Recommendations Section \*\/\}[\s\S]*?\{\/\* Recently Deployed \(Using Tracks Data\) \*\/\}/g;
page = page.replace(regex, rekomendasiHTML + '\n\n          {/* Recently Deployed (Using Tracks Data) */}');

fs.writeFileSync('src/app/page.tsx', page);
console.log("Updated page.tsx recommendations");
