import { cn } from "@/lib/utils"

export function StoriesSection() {
  const stories = [
    { label: 'Daily Plan', image: '/images/star.png', active: true },
    { label: 'Insights', image: '/images/brain.png' },
    { label: 'Secret Chats', image: '/images/moon.png' },
    { label: 'Wellness', image: '/images/heart.png' },
    { label: 'Partner', image: '/images/girl.png' },
  ]

  return (
    <section className="flo-stories-section">
      <div className="flo-stories-container">
        {stories.map((story) => (
          <div key={story.label} className="flo-story-circle">
            <div className={cn("flo-story-ring", story.active && "flo-story-ring--active")}>
              <div className="flo-story-inner">
                <img src={story.image} alt={story.label} className="flo-story-img" />
              </div>
              {story.active && <div className="flo-story-dot" />}
            </div>
            <span className="flo-story-label">{story.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
