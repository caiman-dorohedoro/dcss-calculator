import "./App.css";
import EVCalculator from "./components/EvCalculator";
import ArmourCalculator from "./components/ArmourCalculator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function App() {
  return (
    <div className="p-4">
      <Tabs defaultValue="ev" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
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
