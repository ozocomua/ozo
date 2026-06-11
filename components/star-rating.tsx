"use client"

interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: number
}

export function StarRating({ rating, maxStars = 5, size = 16 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`Рейтинг: ${rating} із ${maxStars}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const fill = rating >= i + 1 ? "#F59E0B" : rating >= i + 0.5 ? "#F59E0B" : "#D1D5DB"
        const strokeColor = rating >= i + 0.5 ? "#F59E0B" : "#D1D5DB"
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.73 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                fill={fill}
                stroke={strokeColor}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )
      })}
    </div>
  )
}

interface StarSelectProps {
  value: number
  onChange: (rating: number) => void
  size?: number
}

export function StarSelect({ value, onChange, size = 28 }: StarSelectProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-colors"
            aria-label={`Оцінити на ${star}`}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.73 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                fill={filled ? "#F59E0B" : "#D1D5DB"}
                stroke={filled ? "#F59E0B" : "#D1D5DB"}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
