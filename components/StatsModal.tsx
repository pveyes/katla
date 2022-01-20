import Modal from "./Modal";
import { GameState, GameStats } from '../utils/types';
import { getTotalPlay, getTotalWin } from "../utils/score";
import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  stats: GameStats;
  date: string;
  answer: string;
  showMessage: (message: string) => void;
}

export default function StatsModal(props: Props) {
  const { isOpen, onClose, gameState, stats, date, answer, showMessage } = props

  const showShare = gameState.answers.filter(Boolean).length === 6 || gameState.answers[gameState.attempt - 1] === answer;
  const totalWin = getTotalWin(stats);
  const totalPlay = getTotalPlay(stats)

  function handleShare() {
    const num = Math.ceil(
      (new Date().getTime() - new Date(date).getTime())
      / 24 / 60 / 60 / 1000
    );
    let text = `Katla ${num} ${gameState.attempt}/6\n\n`;

    gameState.answers.filter(Boolean).forEach(userAnswer => {
      userAnswer.split('').forEach((char, i) => {
        if (answer[i] === char) {
          text += '🟩'
        }
        else if (answer.includes(char)) {
          text += '🟨'
        }
        else {
          text += '⬛'
        }
      })
      text += '\n'
    })

    text += '\nhttps://katla.vercel.app'

    if ('share' in navigator) {
      navigator.share({
        text: text
      })
    }
    else {
      navigator.clipboard.writeText(text);
      showMessage('Disalin ke clipboard')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Title>Statistik</Modal.Title>
      <div className="grid grid-rows-1 grid-cols-4 text-center w-3/4 gap-1 mx-auto mb-8">
        <div>
          <div className="text-md sm:text-xl lg:text-3xl">{totalPlay}</div>
          <div className="text-xs md:text-sm break-word">Dimainkan</div>
        </div>
        <div>
          <div className="text-md sm:text-xl lg:text-3xl">{totalPlay === 0 ? 0 : Math.round(totalWin / totalPlay * 100)}</div>
          <div className="text-xs md:text-sm break-word">% Menang</div>
        </div>
        <div>
          <div className="text-md sm:text-xl lg:text-3xl">{stats.currentStreak}</div>
          <div className="text-xs md:text-sm break-word"><em>Streak</em> Saat Ini</div>
        </div>
        <div>
          <div className="text-md sm:text-xl lg:text-3xl">{stats.maxStreak}</div>
          <div className="text-xs md:text-sm break-word"><em>Streak</em> Maksimum</div>
        </div>
      </div>
      <div className="w-10/12 m-auto">
        <h3 className="text-center uppercase font-semibold">Distribusi Tebakan</h3>
        {Array(6).fill('').map((_, i) => {
          const ratio = totalWin === 0
            ? 7
            : Math.max(Number(stats.distribution[i + 1]) / totalWin * 100, 7)
          const alignment = ratio === 7 ? 'justify-center' : 'justify-end'
          const background = ratio === 7 ? 'bg-gray-700' : 'bg-green-600'
          return (
            <div className="flex h-5 mb-2" key={i}>
              <div className="tabular-nums">{i + 1}</div>
              <div className="w-full h-full pl-1">
                <div className={`text-right ${background} flex ${alignment} px-2`} style={{ width: ratio + '%' }}>{stats.distribution[i + 1]}</div>
              </div>
            </div>
          )
        })}
      </div>
      {showShare && (
        <div className='flex items-center justify-between w-3/4 m-auto my-8 gap-2'>
          <div className='text-center flex flex-1 flex-col'>
            <div className="font-semibold uppercase text-xs md:text-md">Katla berikutnya</div>
            <RemainingTime />
          </div>
          <div className="bg-gray-400" style={{ width: 1 }}></div>
          <button onClick={handleShare} className="bg-green-700 py-1 md:py-3 px-3 md:px-6 rounded-md font-semibold uppercase text-xl flex flex-1 flex-row gap-2 items-center justify-center">
            <div>Share</div>
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
              <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"></path>
            </svg>
          </button>
        </div>
      )}
    </Modal>
  )
}

function RemainingTime() {
  const now = new Date()
  const hours = 23 - now.getHours();
  const seconds = (59 - now.getSeconds()).toString().padStart(2, '0');
  const minutes = (59 - now.getMinutes()).toString().padStart(2, '0');;
  const [remainingTime, setRemainingTime] = useState(`${hours}:${minutes}:${seconds}`);

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date()
      const hours = 23 - now.getHours();
      const seconds = (59 - now.getSeconds()).toString().padStart(2, '0');
      const minutes = (59 - now.getMinutes()).toString().padStart(2, '0');;
      setRemainingTime(`${hours}:${minutes}:${seconds}`)
    }, 500)
    return () => clearInterval(t);
  }, [])
  return (
    <div className='text-xl md:text-4xl'>
      {remainingTime}
    </div>
  )
}
