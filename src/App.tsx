import Calculator from "@/components/Calculator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCalculatorState } from "@/hooks/useCalculatorState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameVersion, gameVersions } from "@/types/game";

function App() {
  const { state, setState, resetState, changeVersion } = useCalculatorState();

  return (
    <div className="p-1 md:p-4 flex items-center justify-center w-screen">
      <Tabs defaultValue="ev" className="w-full max-w-2xl">
        {/* outline: none이 inline style로 적용되어 있어 className이 아닌 style attr를 통해 덮어씌운다 */}
        <TabsList
          className="w-full gap-x-2 relative"
          style={{ outline: "1px solid white", outlineOffset: "-4px" }}
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-x-2">
            <Select
              value={state.version}
              onValueChange={(value) => changeVersion(value as GameVersion)}
            >
              <SelectTrigger className="h-5 w-[150px]">
                <SelectValue placeholder="Version" />
              </SelectTrigger>
              <SelectContent>
                {gameVersions.map((version) => (
                  <SelectItem key={version} value={version}>
                    {version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TabsTrigger value="ev">DCSS Calculator</TabsTrigger>
          <button
            onClick={resetState}
            className="text-sm text-muted-foreground hover:text-foreground absolute right-8"
          >
            <span className="hidden md:block">Reset to Default</span>
            <span className="block md:hidden">Reset</span>
          </button>
        </TabsList>
        <TabsContent value="ev">
          <Calculator state={state} setState={setState} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
