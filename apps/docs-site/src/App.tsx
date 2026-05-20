import { CodeExample } from './components/CodeExample'
import { DashboardPreview } from './components/DashboardPreview'
import { Features } from './components/Features'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Navbar } from './components/Navbar'
import { SplineShowcase } from './components/SplineShowcase'
import { Stats } from './components/Stats'
import { ZoomParallaxFeatures } from './components/ZoomParallaxFeatures'

function App() {
  return (
    <div className="min-h-screen bg-[#030607] text-[#f7fbfa]">
      <Navbar />
      <main>
        <Hero />
        <SplineShowcase />
        <Features />
        <ZoomParallaxFeatures />
        <DashboardPreview />
        <HowItWorks />
        <CodeExample />
        <Stats />
      </main>
      <Footer />
    </div>
  )
}

export default App
