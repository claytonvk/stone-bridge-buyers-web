import { Banner } from '../components/Banner'
import { useNavigate } from 'react-router-dom';
import { DeliveryBanner } from '../components/DeliveryBanner';
import HelpCornerAgent from '../components/HelpCornerAgent';
import { ProcessSection } from '../components/ProcessSection';
import { TrustStrip } from '../components/TrustStrip';
import { CompareSection } from '../components/CompareSection';
import { AnyConditionSection } from '../components/AnyConditionSection';

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <DeliveryBanner />
      <Banner />
      <TrustStrip onCtaClick={() => navigate("/contact")}/>
      <ProcessSection onCtaClick={() => navigate("/contact")}/>
      <CompareSection onCtaClick={() => navigate("/contact")} />
      <AnyConditionSection onCtaClick={() => navigate("/contact")} />
      <HelpCornerAgent />
    </>
  );
}

export default Home
