import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";
import {
  Flex,
  Theme,
  Text,
  Button,
  Grid,
  Card,
  Slider,
  TextField,
  Box,
  Switch,
  Badge,
  DataList,
  BadgeProps,
  Checkbox,
  Tabs,
  RadioCards,
  Heading,
} from "@radix-ui/themes";
import {
  HashIcon,
  KeyRoundIcon,
  LightbulbIcon,
  ShieldCheckIcon,
  ShuffleIcon,
} from "lucide-react";
import "@radix-ui/themes/styles.css";
import "./App.css";
import { isDigit, isLetter, timeToCrackPassword, useCopy } from "./utils";
import useResizeObserver from "use-resize-observer";

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark" | "inherit">("inherit");

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    (async () => {
      setTheme((await getCurrentWindow().theme()) || "inherit");

      unlisten = await getCurrentWindow().onThemeChanged(
        ({ payload: theme }) => {
          console.log(`theme changed to ${theme}`);
          setTheme(theme);
        }
      );
    })();

    return () => {
      if (unlisten != null) {
        unlisten();
      }
    };
  }, []);

  return theme;
};

function App() {
  const [panelType, setPanelType] = useState("generator");
  const [passwordType, setPasswordType] = useState("random");
  const [randomLength, setRandomLength] = useState(20);
  const [randomSymbols, setRandomSymbols] = useState(false);
  const [randomNumbers, setRandomNumbers] = useState(true);
  const [randomUppercase, setRandomUppercase] = useState(true);
  const [memorableLength, setMemorableLength] = useState(4);
  const [memorableUseFullWords, setMemorableUseFullWords] = useState(true);
  const [memorableCapitalizeFirstLetter, setMemorableCapitalizeFirstLetter] =
    useState(false);
  const [memorableUppercase, setMemorableUppercase] = useState(false);
  const [memorableSeparator, setMemorableSeparator] = useState("-");
  const [pinLength, setPinLength] = useState(6);
  const [strength, setStrength] = useState("");
  const [strengthColor, setStrengthColor] =
    useState<BadgeProps["color"]>(undefined);
  const [crackTime, setCrackTime] = useState("");
  const [password, setPassword] = useState("");
  const [copyAsBase64String, setCopyAsBase64String] = useState(false);
  const [isCommon, setIsCommon] = useState(-1);

  const theme = useTheme();
  const { isCopied, copyToClipboard, resetCopyStatus } = useCopy();

  const getStrengthString = (score: number): string => {
    if (score >= 0 && score < 20) {
      return "VERY DANGEROUS";
    } else if (score >= 20 && score < 40) {
      return "DANGEROUS";
    } else if (score >= 40 && score < 60) {
      return "VERY WEAK";
    } else if (score >= 60 && score < 80) {
      return "WEAK";
    } else if (score >= 80 && score < 90) {
      return "GOOD";
    } else if (score >= 90 && score < 95) {
      return "STRONG";
    } else if (score >= 95 && score < 99) {
      return "VERY STRONG";
    } else if (score >= 99 && score <= 100) {
      return "INVULNERABLE";
    } else return "";
  };

  const getStrengthColor = (score: number): BadgeProps["color"] | undefined => {
    if (score >= 0 && score < 40) {
      return "red";
    } else if (score >= 40 && score < 60) {
      return "orange";
    } else if (score >= 60 && score < 80) {
      return "yellow";
    } else if (score >= 80 && score <= 100) {
      return "green";
    } else {
      return undefined;
    }
  };

  async function random_password() {
    const pass: string = await invoke("gen_password", {
      length: randomLength,
      symbols: randomSymbols,
      numbers: randomNumbers,
      uppercase: randomUppercase,
    });
    setPassword(pass as string);

    const score: number = await invoke("score", { password: pass });
    setStrength(getStrengthString(score));
    setStrengthColor(getStrengthColor(score));

    setCrackTime(timeToCrackPassword(pass));
    resetCopyStatus();
  }

  async function gen_words() {
    const words: string[] = await invoke("gen_words", {
      length: memorableLength,
      fullWords: memorableUseFullWords,
    });
    let pass = words
      .map((w) =>
        memorableUppercase
          ? w.toUpperCase()
          : memorableCapitalizeFirstLetter
          ? w.charAt(0).toUpperCase() + w.slice(1)
          : w
      )
      .join(memorableSeparator === "" ? " " : memorableSeparator);
    setPassword(pass);
    resetCopyStatus();
  }

  async function pin() {
    const pass: string = await invoke("gen_pin", {
      length: pinLength,
    });
    setPassword(pass);
    resetCopyStatus();
  }

  async function isCommonPassword(password: string) {
    return await invoke("is_common_password", {
      password,
    });
  }

  useEffect(() => {
    random_password();
  }, [randomLength, randomNumbers, randomSymbols, randomUppercase]);

  useEffect(() => {
    gen_words();
  }, [
    memorableLength,
    memorableCapitalizeFirstLetter,
    memorableUppercase,
    memorableUseFullWords,
    memorableSeparator,
  ]);

  useEffect(() => {
    pin();
  }, [pinLength]);

  const copy = async () => {
    await copyToClipboard(copyAsBase64String ? btoa(password) : password);
  };

  useEffect(() => {
    if (passwordType === "random") {
      random_password();
    } else if (passwordType === "memorable") {
      gen_words();
    } else if (passwordType === "pin") {
      pin();
    }
  }, [passwordType]);

  async function setWindowHeight(height: number) {
    await getCurrentWindow().setSize(new LogicalSize(480, height));
  }

  const { ref } = useResizeObserver<HTMLDivElement>({
    onResize: ({ height }) => {
      if (height) {
        setWindowHeight(height);
      }
    },
  });

  return (
    <Theme
      appearance={theme}
      hasBackground={false}
      panelBackground="translucent"
    >
      <Box ref={ref} data-tauri-drag-region>
        <Box height="30px" data-tauri-drag-region></Box>
        <Tabs.Root value={panelType} onValueChange={setPanelType}>
          <Tabs.List justify="center" size="2" data-tauri-drag-region>
            <Tabs.Trigger value="generator">
              <Flex gap="2" align="center">
                <KeyRoundIcon size={16} strokeWidth={1} />
                Generators
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="analysis">
              <Flex gap="2" align="center">
                <ShieldCheckIcon size={16} strokeWidth={1} />
                Checker
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Box px="5" py="4">
            <Tabs.Content value="generator">
              <Flex data-tauri-drag-region direction="column" gap="2">
                <Text weight="medium" data-tauri-drag-region>
                  Choose a password type
                </Text>

                <RadioCards.Root
                  size="1"
                  columns="3"
                  value={passwordType}
                  onValueChange={setPasswordType}
                  my="2"
                >
                  <RadioCards.Item value="random">
                    <Flex gap="2" align="center">
                      <ShuffleIcon size={16} />
                      Random
                    </Flex>
                  </RadioCards.Item>

                  <RadioCards.Item value="memorable">
                    <Flex gap="2" align="center">
                      <LightbulbIcon size={16} />
                      Memorable
                    </Flex>
                  </RadioCards.Item>
                  <RadioCards.Item value="pin">
                    <Flex gap="2" align="center">
                      <HashIcon size={16} />
                      PIN
                    </Flex>
                  </RadioCards.Item>
                </RadioCards.Root>

                <Text weight="medium" data-tauri-drag-region>
                  Customize your password
                </Text>
                {passwordType === "random" ? (
                  <Flex my="2" direction="column" gap="4">
                    {/* <Separator size="4" /> */}

                    <Flex gap="4" align="center">
                      <Text color="gray">Characters</Text>
                      <Slider
                        value={[randomLength]}
                        onValueChange={(values) => setRandomLength(values[0])}
                        min={4}
                        max={100}
                      />
                      <Box width="80px">
                        <TextField.Root
                          size="2"
                          type="number"
                          min="4"
                          max="100"
                          value={randomLength}
                          readOnly
                        />
                      </Box>
                    </Flex>
                    {/* <Separator size="4" /> */}

                    <Flex gap="4" align="center">
                      <Text color="gray">Numbers</Text>
                      <Switch
                        checked={randomNumbers}
                        onCheckedChange={setRandomNumbers}
                      />
                      <Text color="gray">Symbols</Text>
                      <Switch
                        checked={randomSymbols}
                        onCheckedChange={setRandomSymbols}
                      />
                      <Text color="gray">Uppercase</Text>
                      <Switch
                        checked={randomUppercase}
                        onCheckedChange={setRandomUppercase}
                      />
                    </Flex>
                    {/* <Separator size="4" /> */}
                  </Flex>
                ) : passwordType === "memorable" ? (
                  <Flex my="2" direction="column" gap="4">
                    {/* <Separator size="4" /> */}

                    <Flex gap="4" align="center">
                      <Text color="gray">Characters</Text>
                      <Slider
                        value={[memorableLength]}
                        onValueChange={(values) =>
                          setMemorableLength(values[0])
                        }
                        min={3}
                        max={20}
                      />
                      <Box width="80px">
                        <TextField.Root
                          size="2"
                          type="number"
                          min="3"
                          max="20"
                          value={memorableLength}
                          readOnly
                        />
                      </Box>
                    </Flex>
                    {/* <Separator size="4" /> */}

                    <Flex gap="4" align="center">
                      <Text color="gray">Capitalize</Text>
                      <Switch
                        checked={memorableCapitalizeFirstLetter}
                        onCheckedChange={(checked) => {
                          setMemorableCapitalizeFirstLetter(checked);
                          if (checked) {
                            setMemorableUppercase(false);
                          }
                        }}
                      />
                      <Text color="gray">Uppercase</Text>
                      <Switch
                        checked={memorableUppercase}
                        onCheckedChange={(checked) => {
                          setMemorableUppercase(checked);
                          if (checked) {
                            setMemorableCapitalizeFirstLetter(false);
                          }
                        }}
                      />
                    </Flex>

                    {/* <Separator size="4" /> */}

                    <Flex gap="4" align="center">
                      <Text color="gray">Use full words</Text>
                      <Switch
                        checked={memorableUseFullWords}
                        onCheckedChange={setMemorableUseFullWords}
                      />
                      <Text color="gray">Separator</Text>
                      <Box width="100px">
                        <TextField.Root
                          size="2"
                          maxLength={10}
                          value={memorableSeparator}
                          onChange={(e) =>
                            setMemorableSeparator(e.currentTarget.value)
                          }
                        />
                      </Box>
                    </Flex>
                    {/* <Separator size="4" /> */}
                  </Flex>
                ) : (
                  <Flex my="2" direction="column" gap="4">
                    {/* <Separator size="4" /> */}
                    <Flex gap="4" align="center">
                      <Text color="gray">Characters</Text>
                      <Slider
                        value={[pinLength]}
                        onValueChange={(values) => setPinLength(values[0])}
                        min={3}
                        max={12}
                      />
                      <Box width="80px">
                        <TextField.Root
                          size="2"
                          type="number"
                          min="3"
                          max="12"
                          value={pinLength}
                          readOnly
                        />
                      </Box>
                    </Flex>
                    {/* <Separator size="4" /> */}
                  </Flex>
                )}
                <Text weight="medium" my="2" data-tauri-drag-region>
                  Generated Password
                </Text>
                <Card>
                  <Flex
                    minHeight="135px"
                    align="center"
                    justify="center"
                    data-tauri-drag-region
                  >
                    <Flex
                      wrap="wrap"
                      align="center"
                      justify="center"
                      gap={passwordType === "pin" ? "2" : "0"}
                    >
                      {[...password].map((char, i) =>
                        char === " " ? (
                          <span key={i}>&nbsp;</span>
                        ) : (
                          <Text
                            key={i}
                            size={passwordType === "pin" ? "8" : "4"}
                            color={
                              isDigit(char)
                                ? "blue"
                                : isLetter(char)
                                ? undefined
                                : "orange"
                            }
                            weight="medium"
                          >
                            {char}
                          </Text>
                        )
                      )}
                    </Flex>
                  </Flex>
                </Card>
                {passwordType === "random" ? (
                  <DataList.Root my="2">
                    <DataList.Item>
                      <DataList.Label>Your password strength:</DataList.Label>
                      <DataList.Value>
                        <Badge color={strengthColor}>{strength}</Badge>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label>Estimated time to crack:</DataList.Label>
                      <DataList.Value>{crackTime}</DataList.Value>
                    </DataList.Item>
                  </DataList.Root>
                ) : null}

                <Text as="label" size="2" mt="3">
                  <Flex gap="2">
                    <Checkbox
                      checked={copyAsBase64String}
                      onCheckedChange={(checked) => {
                        console.log(checked);
                        setCopyAsBase64String(checked as boolean);
                      }}
                    />
                    Copy as BASE64 string
                  </Flex>
                </Text>

                <Grid columns="2" gap="4" width="auto" my="2">
                  <Button
                    size="3"
                    variant="solid"
                    color={isCopied ? "green" : undefined}
                    onClick={() => {
                      copy();
                    }}
                  >
                    {isCopied ? "Password Copied!" : "Copy Password"}
                  </Button>
                  <Button
                    size="3"
                    variant="outline"
                    onClick={() => {
                      passwordType === "random"
                        ? random_password()
                        : passwordType === "memorable"
                        ? gen_words()
                        : passwordType === "pin"
                        ? pin()
                        : null;
                    }}
                  >
                    Refresh Password
                  </Button>
                </Grid>
              </Flex>
            </Tabs.Content>

            <Tabs.Content value="analysis" data-tauri-drag-region>
              <Flex mb="5" direction="column">
                <Box width="100%">
                  <TextField.Root
                    size="3"
                    placeholder="Enter a password..."
                    onChange={async (e) => {
                      const value = e.currentTarget.value.trim();
                      if (!value) {
                        setIsCommon(-1);
                        return;
                      }
                      const b = await isCommonPassword(value);
                      if (b) {
                        setIsCommon(1);
                      } else {
                        setIsCommon(0);
                      }
                    }}
                  />
                </Box>

                {isCommon !== -1 ? (
                  <Flex height="32px" align="center">
                    <Text my="2" mr="2" color="gray">
                      Your password is
                    </Text>
                    {isCommon === 1 ? (
                      <Text weight="medium" color="red">
                        Common
                      </Text>
                    ) : isCommon === 0 ? (
                      <Text weight="medium" color="green">
                        Not Common
                      </Text>
                    ) : null}
                  </Flex>
                ) : null}
              </Flex>
              <Flex direction="column" gap="3" mb="5">
                <Heading size="4">
                  The principles of generating a strong password
                </Heading>
                <Heading size="3">Make it unique</Heading>
                <Text size="2" color="gray">
                  Passwords should be unique to different accounts. This reduces
                  the likelihood that multiple accounts of yours could be hacked
                  if one of your passwords is exposed in a data breach.
                </Text>
                <Heading size="3">Make it random</Heading>
                <Text size="2" color="gray">
                  The password has a combination of uppercase and lowercase
                  letters, numbers, special characters, and words with no
                  discernable pattern, unrelated to your personal information.
                </Text>
                <Heading size="3">Make it long</Heading>
                <Text size="2" color="gray">
                  The password consists of 14 characters or longer. An
                  8-character password will take a hacker 39 minutes to crack
                  while a 16-character password will take a hacker a billion
                  years to crack.
                </Text>
              </Flex>
            </Tabs.Content>
            <Tabs.Content value="settings">
              <Text size="2">settings</Text>
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Box>
    </Theme>
  );
}

export default App;
