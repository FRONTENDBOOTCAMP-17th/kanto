import SpamConfigCard from "./spam/SpamConfigCard";
import SanctionTemplateList from "./spam/SanctionTemplateList";

export default function SpamSection() {
  return (
    <div className="flex flex-col gap-5">
      <SpamConfigCard />
      <SanctionTemplateList />
    </div>
  );
}
