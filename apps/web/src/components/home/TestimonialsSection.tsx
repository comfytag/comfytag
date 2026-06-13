import { Star } from 'lucide-react'

interface TestimonialNormalized {
  _id: string
  userName: string
  userImage?: string
  quote: string
  rating?: number
}

interface TestimonialsSectionProps {
  testimonials: TestimonialNormalized[]
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  if (!testimonials || testimonials.length === 0) return null

  return (
    <section className="w-full py-16 md:py-24 bg-zinc-50 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 mb-4 text-center">
          Loved by attendees.
        </h2>
        <p className="text-lg text-zinc-500 max-w-2xl mx-auto text-center mb-16">
          Don&apos;t just take our word for it. Here is what happens when you remove the friction from ticketing.
        </p>

        <div className="flex overflow-x-auto gap-4 pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial._id}
              className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-zinc-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow shrink-0 w-[85vw] sm:w-85 snap-center md:w-auto md:shrink"
            >
              <div>
                <div className="flex gap-1 mb-6 text-amber-400" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>

                <p className="text-zinc-700 text-lg leading-relaxed font-medium mb-8">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg shrink-0"
                  aria-hidden="true"
                >
                  {testimonial.userName.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-zinc-900">{testimonial.userName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
