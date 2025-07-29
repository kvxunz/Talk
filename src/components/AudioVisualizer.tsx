interface AudioVisualizerProps {
  data: number[]
}

export function AudioVisualizer({ data }: AudioVisualizerProps) {
  return (
    <div className="relative w-full h-24 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-2xl"></div>
      <div className="relative flex items-center justify-center gap-[2px] h-full w-full px-4">
        {data.map((rms, index) => {
          const height = Math.min(80, Math.max(12, rms * 80));
          const isCenter = Math.abs(index - data.length / 2) < 3;
          
          return (
            <div
              key={index}
              className={`w-1 rounded-full transition-all duration-150 ${
                isCenter ? 'scale-y-110' : ''
              }`}
              style={{
                height: `${height}%`,
                background: `linear-gradient(180deg, 
                  ${isCenter ? 'rgb(79, 70, 229)' : 'rgb(99, 102, 241)'} 0%, 
                  ${isCenter ? 'rgb(129, 140, 248)' : 'rgb(165, 180, 252)'} 100%)`
              }}
            />
          );
        })}
      </div>
      
      {/* 反射效果 */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-white/10 dark:to-black/10 backdrop-blur-[1px] rounded-b-2xl"></div>
      
      {/* 发光效果 */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 blur-2xl opacity-30 rounded-2xl pointer-events-none"></div>
    </div>
  )
}
