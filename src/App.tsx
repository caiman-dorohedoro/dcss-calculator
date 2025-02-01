import EVCalculator from "./components/EvCalculator";
import ArmourCalculator from "./components/ArmourCalculator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function App() {
  return (
    <div className="p-4 flex items-center justify-center w-screen">
      <Tabs defaultValue="ev" className="w-full max-w-2xl">
        <TabsList className="w-full">
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
