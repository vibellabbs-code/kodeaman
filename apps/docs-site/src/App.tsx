import { CodeExample } from './components/CodeExample'
import { DashboardPreview } from './components/DashboardPreview'
import { Features } from './components/Features'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { InteractiveText } from './components/InteractiveText'
import { Navbar } from './components/Navbar'
import { SplineShowcase } from './components/SplineShowcase'
import { Stats } from './components/Stats'

function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa]">
      <Navbar />
      <main>
        <Hero />
        <SplineShowcase />
        <Features />
        <InteractiveText />
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
