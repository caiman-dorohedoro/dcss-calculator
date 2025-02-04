import Calculator from "./components/Calculator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function App() {
  return (
    <div className="p-4 flex items-center justify-center w-screen">
      <Tabs defaultValue="ev" className="w-full max-w-2xl">
        {/* outline: none이 inline style로 적용되어 있어 className이 아닌 style attr를 통해 덮어씌운다 */}
        <TabsList
          className="w-full gap-x-2"
          style={{ outline: "1px solid white", outlineOffset: "-4px" }}
        >
          <TabsTrigger value="ev">DCSS Calculator</TabsTrigger>
        </TabsList>
        <TabsContent value="ev">
          <Calculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
