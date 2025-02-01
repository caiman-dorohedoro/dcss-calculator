import "./App.css";
import EVCalculator from "./components/EvCalculator";
import ArmourCalculator from "./components/ArmourCalculator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function App() {
  return (
    <div className="p-4">
      <Tabs defaultValue="ev">
        <TabsList>
          <TabsTrigger value="ev">EV Calculator</TabsTrigger>
          <TabsTrigger value="armour">Armour Calculator</TabsTrigger>
        </TabsList>
        <TabsContent value="ev">
          <EVCalculator />
        </TabsContent>
        <TabsContent value="armour">
          <ArmourCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
