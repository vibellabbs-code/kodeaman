import { animate, motion, useInView, useMotionValue, useScroll, useTransform } from 'framer-motion'
import type { ReactNode } from 'react'
import type { Variants } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

type ChildrenProps = {
  children: ReactNode
  className?: string
}

const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export function FadeIn({ children, className }: ChildrenProps) {
  return (
    <motion.div className={className} initial="hidden" animate="visible" variants={fadeInVariants}>
      {children}
    </motion.div>
  )
}

export function ScrollReveal({ children, className }: ChildrenProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div ref={ref} className={className} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeInVariants}>
      {children}
    </motion.div>
  )
}

export function StaggerContainer({ children, className }: ChildrenProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: ChildrenProps) {
  return (
    <motion.div className={className} variants={fadeInVariants}>
      {children}
    </motion.div>
  )
}

export function ParallaxImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [-24, 24])

  return <motion.img ref={ref} src={src} alt={alt} className={className} style={{ y }} />
}

export function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const controls = animate(count, value, { duration: 1.4, ease: 'easeOut' })
    const unsubscribe = count.on('change', (latest) => setDisplay(Math.round(latest)))

    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [count, isInView, value])

  return <span ref={ref}>{display}{suffix}</span>
}
