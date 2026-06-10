import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

const STORIES = [
  { label: 'Daily Plan', image: '/images/star.png', active: true, route: '/dashboard' },
  { label: 'Insights', image: '/images/brain.png', route: '/insights' },
  { label: 'Secret Chats', image: '/images/moon.png', route: '/ask' },
  { label: 'Wellness', image: '/images/heart.png', route: '/wellness-tips' },
  { label: 'Partner', image: '/images/girl.png', route: '/sync' },
]

export function StoriesSection() {
  const navigate = useNavigate()

  return (
    <section className="flo-stories-section">
      <div className="flo-stories-container">
        {STORIES.map((story) => (
          <button type="button" 
            key={story.label} 
            className="flo-story-circle cursor-pointer appearance-none bg-transparent border-none p-0 outline-none hover:scale-105 transition-transform"
            onClick={() => navigate(story.route)}
          >
            <div className={cn("flo-story-ring", story.active && "flo-story-ring--active")}>
              <div className="flo-story-inner">
                <img src={story.image} alt={story.label} className="flo-story-img" />
              </div>
              {story.active && <div className="flo-story-dot" />}
            </div>
            <span className="flo-story-label">{story.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
