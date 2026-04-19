import { SCORING } from './constants'

// ─── Points for a series prediction ──────────────────────────────────────────
export function calcSeriesPts(pred, series) {
  if (!series?.winner || !pred?.predicted_winner) return 0
  const config = SCORING[pred.type] || SCORING.initial
  let pts = 0
  if (pred.predicted_winner === series.winner) {
    pts += config.winner
    if (pred.predicted_games && pred.predicted_games === series.actualGames) {
      pts += config.gamesBonus
    }
  }
  return pts
}

// ─── Total points for a user ──────────────────────────────────────────────────
// predictions : [{ series_key, type, predicted_winner, predicted_games }]
// seriesMap   : { [series_key]: { winner, actualGames, status } }
export function calcTotalPts(predictions, seriesMap) {
  if (!predictions?.length) return { total: 0, breakdown: {} }

  let total = 0
  const breakdown = {}

  // Points per series (initial + series picks stack)
  predictions.forEach(p => {
    const s = seriesMap[p.series_key]
    if (!s) return
    const pts = calcSeriesPts(p, s)
    total += pts
    if (!breakdown[p.series_key]) breakdown[p.series_key] = 0
    breakdown[p.series_key] += pts
  })

  // Conference finalist bonus
  ;['east_r3_0', 'west_r3_0'].forEach(key => {
    const s = seriesMap[key]
    if (!s?.winner) return
    const correct = predictions.some(p => p.series_key === key && p.predicted_winner === s.winner)
    if (correct) {
      total += SCORING.confFinalist
      breakdown['_confFinalist'] = (breakdown['_confFinalist'] || 0) + SCORING.confFinalist
    }
  })

  // NBA finalist and champion bonus
  const finals = seriesMap['finals_0']
  if (finals?.winner) {
    const preds = predictions.filter(p => p.series_key === 'finals_0')
    const champPred = preds.find(p => p.predicted_winner === finals.winner)
    if (champPred) {
      total += SCORING.champion
      breakdown['_champion'] = SCORING.champion
    } else if (preds.length > 0) {
      total += SCORING.finalist
      breakdown['_finalist'] = SCORING.finalist
    }
  }

  return { total, breakdown }
}
