import PersonalDetails from "./PersonalDetails.jsx";
import Summary from "./Summary.jsx";
import Experience from "./Experience.jsx";
import Projects from "./Projects.jsx";
import Education from "./Education.jsx";
import Skills from "./Skills.jsx";
import Achievements from "./Achievements.jsx";
import Responsibilities from "./Responsibilities.jsx";
import Certifications from "./Certifications.jsx";

export default function FormPanel() {
  return (
    <div className="h-full overflow-y-auto bg-white">
      <PersonalDetails />
      <Summary />
      <Experience />
      <Projects />
      <Education />
      <Skills />
      <Achievements />
      <Responsibilities />
      <Certifications />
    </div>
  );
}
