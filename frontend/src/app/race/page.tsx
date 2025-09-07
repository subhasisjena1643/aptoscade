'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAptosWallet } from '@/hooks/useAptosWallet';
import { useAptosContract } from '@/hooks/useAptosContract';
import { useSocket } from '@/hooks/useSocket';
import {
  RetroScanlines,
  RetroPixelRain,
  RetroParticleSystem,
  RetroFloatingElements,
  RetroGridLines,
  RetroDataStream,
  RetroMatrix,
  RetroTypewriter,
  RetroSoundEffect,
  RetroButton,
  RetroGlitch
} from '@/components/RetroAnimations';

interface RacePlayer {
  id: string;
  username: string;
  avatar: string;
  position: number;
  taps: number;
  ready: boolean;
  connected: boolean;
}

interface RaceState {
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  startTime: number | null;
  duration: number;
  winner: string | null;
  results: Array<{
    playerId: string;
    position: number;
    finishTime: number;
    tapsCount: number;
  }>;
}

export default function RacePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raceMode = searchParams.get('mode') || 'multiplayer';
  
  // Wallet and Contract Integration
  const { isConnected: isWalletConnected, account } = useAptosWallet();
  const { completeRace } = useAptosContract();
  
  // Socket Integration for Multiplayer  
  const { socket, isConnected: isSocketConnected } = useSocket();
  
  // Game State
  const [raceState, setRaceState] = useState<RaceState>({
    status: 'waiting',
    startTime: null,
    duration: 0,
    winner: null,
    results: []
  });
  
  const [players, setPlayers] = useState<RacePlayer[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<RacePlayer | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isRealMultiplayer, setIsRealMultiplayer] = useState(false);
  
  // Tap frequency tracking for speed bonuses
  const [tapHistory, setTapHistory] = useState<number[]>([]);
  const [lastTapTime, setLastTapTime] = useState(0);
  
  // Refs
  const raceTrackRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Audio
  const { playBeep } = RetroSoundEffect();
  
  // Real multiplayer tap handler
  const handleTap = useCallback(() => {
    if (raceState.status !== 'racing' || !currentPlayer) return;
    
    playBeep();
    
    const currentTime = Date.now();
    
    // Calculate tap frequency for speed bonus
    setTapHistory(prev => {
      const newHistory = [...prev, currentTime];
      return newHistory.filter(time => currentTime - time < 2000);
    });
    
    const recentTaps = tapHistory.filter(time => currentTime - time < 1000).length + 1;
    const tapFrequency = recentTaps;
    const speedBonus = Math.min(tapFrequency / 10, 0.5);
    
    // Update local player state
    setPlayers(prev => prev.map(player => 
      player.id === currentPlayer.id 
        ? { 
            ...player, 
            taps: player.taps + 1,
            position: Math.min(player.position + (10 + speedBonus * 10), 100)
          }
        : player
    ));
    
    // Send to multiplayer server
    if (socket && isSocketConnected && roomId) {
      socket.emit('player_tap', {
        roomId,
        playerId: currentPlayer.id,
        taps: currentPlayer.taps + 1,
        speedBonus
      });
    }
    
    setLastTapTime(currentTime);
  }, [raceState.status, currentPlayer, tapHistory, playBeep, socket, isSocketConnected, roomId]);

  // Ready state toggle
  const toggleReady = useCallback(() => {
    if (!currentPlayer || !socket || !isSocketConnected || !roomId) return;
    
    const newReadyState = !currentPlayer.ready;
    
    setPlayers(prev => prev.map(p => 
      p.id === currentPlayer.id ? { ...p, ready: newReadyState } : p
    ));
    
    socket.emit('player_ready', {
      roomId,
      playerId: currentPlayer.id,
      ready: newReadyState
    });
  }, [currentPlayer, socket, isSocketConnected, roomId]);
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleTap();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleTap]);

  // Real-time multiplayer integration
  useEffect(() => {
    if (!socket || !isSocketConnected) return;

    // Join race room
    socket.emit('join_race', {
      playerId: account?.address || `guest_${Date.now()}`,
      username: account?.address ? `Player_${account.address.slice(-4)}` : 'Guest Player',
      avatar: '🏎️'
    });

    // Listen for room updates
    socket.on('room_joined', (data: { roomId: string, players: RacePlayer[] }) => {
      setRoomId(data.roomId);
      setPlayers(data.players);
      setIsRealMultiplayer(true);
      const myPlayer = data.players.find(p => p.id === (account?.address || `guest_${Date.now()}`));
      setCurrentPlayer(myPlayer || null);
    });

    socket.on('player_joined', (players: RacePlayer[]) => {
      setPlayers(players);
    });

    socket.on('player_left', (players: RacePlayer[]) => {
      setPlayers(players);
    });

    socket.on('player_ready', (data: { playerId: string, ready: boolean }) => {
      setPlayers(prev => prev.map(p => 
        p.id === data.playerId ? { ...p, ready: data.ready } : p
      ));
    });

    socket.on('race_countdown', (count: number) => {
      setCountdown(count);
      setRaceState(prev => ({ ...prev, status: 'countdown' }));
    });

    socket.on('race_start', (data: { startTime: number }) => {
      setRaceState(prev => ({ 
        ...prev, 
        status: 'racing', 
        startTime: data.startTime 
      }));
      setCountdown(0);
    });

    socket.on('player_progress', (data: { playerId: string, taps: number, position: number }) => {
      setPlayers(prev => prev.map(p => 
        p.id === data.playerId ? { ...p, taps: data.taps, position: data.position } : p
      ));
    });

    socket.on('race_finished', (results: RaceState['results']) => {
      setRaceState(prev => ({ 
        ...prev, 
        status: 'finished', 
        results,
        winner: results[0]?.playerId || null
      }));
      setShowResults(true);
      
      // Process rewards for connected wallet users
      if (isWalletConnected && account && completeRace) {
        const raceId = roomId || `race_${Date.now()}`;
        completeRace(raceId, results.map(r => ({
          playerId: r.playerId,
          position: r.position,
          finishTime: r.finishTime,
          tapsCount: r.tapsCount
        })))
        .catch(error => console.error('Failed to process race rewards:', error));
      }
    });

    return () => {
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('player_ready');
      socket.off('race_countdown');
      socket.off('race_start');
      socket.off('player_progress');
      socket.off('race_finished');
    };
  }, [socket, isSocketConnected, account, isWalletConnected, completeRace]);

  // Demo race start
  const startDemoRace = () => {
    setRaceState(prev => ({ ...prev, status: 'countdown' }));
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setRaceState(prev => ({
            ...prev,
            status: 'racing',
            startTime: Date.now()
          }));
          
          // Start AI competitors
          startAICompetitors();
          
          return 0;
        }
        playBeep();
        return prev - 1;
      });
    }, 1000);
  };

  // AI competitors logic (much slower and balanced)
  const startAICompetitors = () => {
    const aiInterval = setInterval(() => {
      setPlayers(prevPlayers => {
        return prevPlayers.map(player => {
          // Skip the current player (human)
          if (player.id === currentPlayer?.id) return player;
          
          // AI players progress much slower now
          if (Math.random() > 0.6) { // 40% chance to "tap" (reduced from 70%)
            const newTaps = player.taps + 1;
            // Much smaller progress: 2-6 pixels instead of 15-55, race distance is now 3000
            const newPosition = Math.min(player.position + (Math.random() * 4 + 2), 3000);
            return {
              ...player,
              taps: newTaps,
              position: newPosition,
              connected: true // Show AI as active
            };
          }
          return player;
        });
      });
    }, 200 + Math.random() * 400); // Slower interval: 200-600ms instead of 100-300ms

    // Clear AI interval when race finishes (extend max time for longer races)
    setTimeout(() => clearInterval(aiInterval), 120000); // Stop after 2 minutes max
  };

  // Check for race completion (updated for longer race distance)
  useEffect(() => {
    if (raceState.status === 'racing') {
      const winner = players.find(player => player.position >= 3000); // Updated finish line
      if (winner && !raceState.winner) {
        setRaceState(prev => ({
          ...prev,
          status: 'finished',
          winner: winner.id,
          duration: Date.now() - (prev.startTime || 0),
          results: players
            .sort((a, b) => b.position - a.position)
            .map((player, index) => ({
              playerId: player.id,
              position: index + 1,
              finishTime: Date.now(),
              tapsCount: player.taps
            }))
        }));
        setShowResults(true);
      }
    }
  }, [players, raceState.status, raceState.winner, raceState.startTime]);

  // Restart race function
  const restartRace = () => {
    // Reset all players' positions and taps
    setPlayers(prevPlayers => 
      prevPlayers.map(player => ({
        ...player,
        position: 0,
        taps: 0,
        connected: player.id === currentPlayer?.id // Only current player stays connected initially
      }))
    );
    
    // Reset race state
    setRaceState({
      status: 'waiting',
      startTime: null,
      duration: 0,
      winner: null,
      results: []
    });
    
    setCountdown(0);
    setShowResults(false);
    
    // Reset current player
    if (currentPlayer) {
      setCurrentPlayer(prev => prev ? { ...prev, position: 0, taps: 0 } : null);
    }
  };

  return (
    <div className="min-h-screen retro-grid crt-effect retro-distortion" style={{ background: 'var(--retro-bg)' }}>
      {/* Enhanced Background Effects - Same as Homepage */}
      <RetroScanlines />
      <RetroPixelRain count={40} />
      <RetroParticleSystem count={25} />
      <RetroFloatingElements count={20} />
      <RetroGridLines />
      <RetroDataStream lines={6} />
      <RetroMatrix />
      
      {/* Header - Matching Homepage Style Exactly */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="retro-window mx-4 mt-4 retro-slide-in"
      >
        <div className="retro-window-header">
          <div className="flex items-center gap-2">
            <span className="pixel-text" style={{ fontSize: '6px' }}>🏁</span>
            <span className="pixel-text tracking-wider" style={{ fontSize: '8px' }}>
              TAP_RACING_CHAMPIONSHIP.EXE
            </span>
          </div>
          <div className="retro-window-controls">
            <button className="retro-btn minimize">-</button>
            <button className="retro-btn maximize">□</button>
            <button 
              onClick={() => router.push('/')}
              className="retro-btn close"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="retro-window-content p-4">
          {/* Status Panel - Matching Homepage Terminal Style */}
          <div className="retro-panel bg-black text-green-400 font-mono text-xs p-4 retro-hologram">
            <div className="flex justify-between items-center">
              <div className="pixel-text" style={{ fontSize: '8px' }}>
                STATUS: <span className="text-retro-accent font-bold">
                  {raceState.status.toUpperCase()}
                </span>
              </div>
              <div className="pixel-text" style={{ fontSize: '8px' }}>
                PLAYERS: <span className="text-retro-success">
                  {players.filter(p => p.ready).length}/4
                </span>
              </div>
              <div className="pixel-text" style={{ fontSize: '8px' }}>
                MODE: {raceMode.toUpperCase()}
              </div>
              {account && (
                <div className="pixel-text" style={{ fontSize: '6px' }}>
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Race Area */}
      <div className="flex-1 p-4 space-y-4">
        {/* Countdown Overlay */}
        <AnimatePresence>
          {raceState.status === 'countdown' && countdown > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: 'rgba(26, 26, 46, 0.9)' }}
            >
              <RetroGlitch>
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    textShadow: [
                      '0 0 20px #e94560',
                      '0 0 40px #e94560, 0 0 60px #e94560',
                      '0 0 20px #e94560'
                    ]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-8xl font-bold text-red-400 pixel-text"
                >
                  {countdown}
                </motion.div>
              </RetroGlitch>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Race Track */}
        <div ref={raceTrackRef} className="retro-window">
          <div className="retro-window-header">
            <span className="pixel-text" style={{ fontSize: '8px' }}>🏁 RACE TRACK</span>
          </div>
          <div className="retro-window-content p-6 space-y-4">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Track Lane */}
                <div 
                  className="h-16 border-2 rounded relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)',
                    borderColor: player.id === currentPlayer?.id ? '#e94560' : '#4a90e2'
                  }}
                >
                  {/* Track Lines */}
                  <div className="absolute inset-0 flex items-center">
                    <div 
                      className="w-full h-px bg-white opacity-30" 
                      style={{ 
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 10px, white 10px, white 15px)' 
                      }} 
                    />
                  </div>
                  
                  {/* Player Car */}
                  <motion.div
                    animate={{ 
                      x: (player.position / 3000) * (raceTrackRef.current?.clientWidth || 800) - 50
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="absolute top-2 left-2 text-3xl"
                    style={{
                      filter: player.connected ? 'none' : 'grayscale(100%)'
                    }}
                  >
                    {player.avatar}
                  </motion.div>
                  
                  {/* Finish Line */}
                  <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-yellow-400 opacity-50" />
                </div>
                
                {/* Player Info - Matching Homepage Style */}
                <div className="flex justify-between items-center mt-1">
                  <span className={`pixel-text ${player.id === currentPlayer?.id ? 'text-red-400' : 'text-blue-400'}`} style={{ fontSize: '8px' }}>
                    {player.username}
                  </span>
                  <span className="pixel-text text-green-400" style={{ fontSize: '6px' }}>
                    {player.taps} TAPS • {Math.floor((player.position / 3000) * 100)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tap Button */}
        {raceState.status === 'racing' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-20 left-1/2 transform -translate-x-1/2"
          >
            <RetroButton
              onClick={handleTap}
              className="w-48 h-24 text-2xl font-bold retro-pulse"
              variant="accent"
            >
              🚀 TAP!
            </RetroButton>
            <div className="text-center mt-2 pixel-text text-gray-400" style={{ fontSize: '6px' }}>
              PRESS SPACE OR CLICK TO TAP
            </div>
          </motion.div>
        )}

        {/* Waiting for Players / Start Race */}
        {raceState.status === 'waiting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="retro-window"
          >
            <div className="retro-window-content p-8 text-center">
              <RetroTypewriter
                text="READY TO RACE?"
                speed={100}
                className="text-xl pixel-text text-yellow-400 mb-6"
              />
              <div className="space-y-4 mb-6">
                {players.map((player, i) => (
                  <div 
                    key={player.id}
                    className={`p-3 border-2 rounded ${
                      player.ready 
                        ? 'border-green-400 bg-green-400/10 text-green-400' 
                        : 'border-gray-600 bg-gray-800/50 text-gray-500'
                    }`}
                  >
                    <span className="pixel-text" style={{ fontSize: '8px' }}>
                      {player.ready ? (
                        `${player.avatar} ${player.username} - READY`
                      ) : (
                        `🔒 ${player.username} - WAITING...`
                      )}
                    </span>
                  </div>
                ))}
              </div>
              
              <RetroButton
                onClick={currentPlayer ? toggleReady : undefined}
                className={`text-xl px-8 py-4 retro-flicker ${!currentPlayer ? 'opacity-50' : ''}`}
              >
                {currentPlayer?.ready ? '⏸️ NOT READY' : '✅ READY UP'}
              </RetroButton>
            </div>
          </motion.div>
        )}

        {/* Race Finished - Show Restart */}
        {raceState.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="retro-window mt-6"
          >
            <div className="retro-window-content p-8 text-center">
              <RetroTypewriter
                text={`🏆 RACE COMPLETE! Winner: ${raceState.winner === currentPlayer?.id ? 'YOU' : players.find(p => p.id === raceState.winner)?.username || 'Unknown'}`}
                speed={50}
                className="text-xl pixel-text text-yellow-400 mb-6"
              />
              <div className="mb-6">
                <div className="pixel-text text-cyan-400" style={{ fontSize: '10px' }}>
                  Race Duration: {Math.floor((raceState.duration || 0) / 1000)}s
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <RetroButton
                  onClick={restartRace}
                  className="px-6 py-3"
                >
                  <span className="pixel-text" style={{ fontSize: '10px' }}>
                    🔄 RACE AGAIN
                  </span>
                </RetroButton>
                
                <RetroButton
                  onClick={() => router.push('/')}
                  variant="secondary"
                  className="px-6 py-3"
                >
                  <span className="pixel-text" style={{ fontSize: '10px' }}>
                    🏠 HOME
                  </span>
                </RetroButton>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
