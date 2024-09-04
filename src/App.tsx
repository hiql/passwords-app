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
  Tabs,
  RadioCards,
  Heading,
  Separator,
  TextArea,
} from "@radix-ui/themes";
import {
  ClipboardIcon,
  ClipboardPasteIcon,
  FlaskConicalIcon,
  HashIcon,
  LightbulbIcon,
  PaintbrushIcon,
  ShuffleIcon,
  SquareAsteriskIcon,
  WandIcon,
} from "lucide-react";
import "@radix-ui/themes/styles.css";
import "./App.css";
import { isDigit, isLetter, useCopy, useDebounce } from "./utils";
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

function App() {
  const [panelType, setPanelType] = useState("generator");
  const [passwordType, setPasswordType] = useState("random");
  const [randomLength, setRandomLength] = useState(20);
  const [randomSymbols, setRandomSymbols] = useState(false);
  const [randomNumbers, setRandomNumbers] = useState(true);
  const [randomUppercase, setRandomUppercase] = useState(true);
  const [randomExcludeSimilarCharacters, setRandomExcludeSimilarCharacters] =
    useState(false);

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
  const [isCommon, setIsCommon] = useState(-1);

  const [hashPassword, setHashPassword] = useState("");
  const [md5String, setMd5String] = useState("");
  const [md5Uppercase, setMd5Uppercase] = useState(false);
  const [bcryptString, setBcryptString] = useState("");
  const [base64String, setBase64String] = useState("");
  const [sha256String, setSha256String] = useState("");
  const [sha512String, setSha512String] = useState("");

  const theme = useTheme();
  const { isCopied, copyToClipboard, resetCopyStatus } = useCopy();

  async function random_password() {
    const pass: string = await invoke("gen_password", {
      length: randomLength,
      symbols: randomSymbols,
      numbers: randomNumbers,
      uppercase: randomUppercase,
      excludeSimilarCharacters: randomExcludeSimilarCharacters,
    });
    setPassword(pass as string);

    const score: number = await invoke("score", { password: pass });
    setStrength(getStrengthString(score));
    setStrengthColor(getStrengthColor(score));

    const time: string = await invoke("crack_times", {
      password,
    });
    setCrackTime(time);

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

  async function hashAsync() {
    if (hashPassword) {
      const md5: string = await invoke("md5", {
        password: hashPassword,
      });
      setMd5String(md5);
    } else {
      setMd5String("");
    }

    if (hashPassword) {
      const base64: string = await invoke("base64", {
        password: hashPassword,
      });
      setBase64String(base64);
    } else {
      setBase64String("");
    }
    if (hashPassword) {
      const bcrypt: string = await invoke("bcrypt", {
        password: hashPassword,
      });
      setBcryptString(bcrypt);
    } else {
      setBcryptString("");
    }

    if (hashPassword) {
      const sha256: string = await invoke("sha256", {
        password: hashPassword,
      });
      setSha256String(sha256);
    } else {
      setSha256String("");
    }

    if (hashPassword) {
      const sha512: string = await invoke("sha512", {
        password: hashPassword,
      });
      setSha512String(sha512);
    } else {
      setSha512String("");
    }
  }

  const hash = useDebounce(hashPassword, 400);

  useEffect(() => {
    random_password();
  }, [
    randomLength,
    randomNumbers,
    randomSymbols,
    randomUppercase,
    randomExcludeSimilarCharacters,
  ]);

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

  useEffect(() => {
    hashAsync();
  }, [hash]);

  const copy = async () => {
    await copyToClipboard(password);
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

  useEffect(() => {
    setHashPassword(password);
  }, [password]);

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
      <Box ref={ref}>
        <Box height="35px" data-tauri-drag-region></Box>
        <Tabs.Root value={panelType} onValueChange={setPanelType}>
          <Tabs.List justify="center">
            <Tabs.Trigger value="generator">
              <Flex gap="2" align="center">
                <WandIcon size={16} />
                Generator
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="hasher">
              <Flex gap="2" align="center">
                <HashIcon size={16} />
                Hasher
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="analyzer">
              <Flex gap="2" align="center">
                <FlaskConicalIcon size={16} />
                Analyzer
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Box px="5" py="4">
            <Tabs.Content value="generator">
              <Flex direction="column" gap="2">
                <Text weight="medium">Choose a password type</Text>
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
                      <SquareAsteriskIcon size={16} />
                      PIN
                    </Flex>
                  </RadioCards.Item>
                </RadioCards.Root>

                <Text weight="medium">Customize your password</Text>
                {passwordType === "random" ? (
                  <Flex direction="column" gap="4" my="2">
                    <Flex gap="4" align="center">
                      <Text color="gray">Characters</Text>
                      <Slider
                        value={[randomLength]}
                        onValueChange={(values) => setRandomLength(values[0])}
                        min={4}
                        max={100}
                      />
                      <Box width="50px">
                        <TextField.Root
                          size="1"
                          type="number"
                          min="4"
                          max="100"
                          value={randomLength}
                          readOnly
                        />
                      </Box>
                    </Flex>
                    <Separator size="4" />
                    <Flex gap="4" align="center" wrap="wrap">
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
                    <Separator size="4" />
                    <Flex gap="4" align="center" wrap="wrap">
                      <Text color="gray">
                        Exclude similar characters(iI1loO0"'`|)
                      </Text>
                      <Switch
                        checked={randomExcludeSimilarCharacters}
                        onCheckedChange={setRandomExcludeSimilarCharacters}
                      />
                    </Flex>
                  </Flex>
                ) : passwordType === "memorable" ? (
                  <Flex my="2" direction="column" gap="4">
                    <Flex gap="4" align="center">
                      <Text color="gray">Characters</Text>
                      <Slider
                        value={[memorableLength]}
                        onValueChange={(values) =>
                          setMemorableLength(values[0])
                        }
                        min={3}
                        max={15}
                      />
                      <Box width="50px">
                        <TextField.Root
                          size="1"
                          type="number"
                          min="3"
                          max="15"
                          value={memorableLength}
                          readOnly
                        />
                      </Box>
                    </Flex>
                    <Separator size="4" />

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

                    <Separator size="4" />

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
                  </Flex>
                ) : (
                  <Flex my="2" direction="column" gap="4">
                    <Flex gap="4" align="center">
                      <Text color="gray">Characters</Text>
                      <Slider
                        value={[pinLength]}
                        onValueChange={(values) => setPinLength(values[0])}
                        min={3}
                        max={12}
                      />
                      <Box width="50px">
                        <TextField.Root
                          size="1"
                          type="number"
                          min="3"
                          max="12"
                          value={pinLength}
                          readOnly
                        />
                      </Box>
                    </Flex>
                  </Flex>
                )}
                <Text weight="medium" my="2">
                  Generated Password
                </Text>
                <Card>
                  <Flex minHeight="80px" align="center" justify="center" p="2">
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
                  <Grid columns="2" my="2">
                    <DataList.Root orientation="vertical">
                      <DataList.Item>
                        <DataList.Label>Your password strength:</DataList.Label>
                        <DataList.Value>
                          <Badge color={strengthColor}>{strength}</Badge>
                        </DataList.Value>
                      </DataList.Item>
                    </DataList.Root>
                    <DataList.Root orientation="vertical">
                      <DataList.Item>
                        <DataList.Label>
                          Estimated time to crack:
                        </DataList.Label>
                        <DataList.Value>{crackTime}</DataList.Value>
                      </DataList.Item>
                    </DataList.Root>
                  </Grid>
                ) : null}

                {/* <Text as="label" size="2" mt="3">
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
                </Text> */}

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
            <Tabs.Content value="analyzer">
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
            <Tabs.Content value="hasher">
              <Flex direction="column" gap="3" mb="5">
                <TextArea
                  placeholder="Enter or paste password here..."
                  value={hashPassword}
                  onChange={(e) => setHashPassword(e.currentTarget.value)}
                />
                <Flex align="center" gap="4" justify="end" mb="4">
                  <Button variant="ghost" size="1">
                    <ClipboardPasteIcon size={12} strokeWidth={1} /> Paste
                  </Button>
                  <Button
                    variant="ghost"
                    size="1"
                    onClick={() => setHashPassword("")}
                  >
                    <PaintbrushIcon size={12} strokeWidth={1} /> Clear
                  </Button>
                </Flex>
                <Flex align="center" justify="between">
                  <Text weight="medium">MD5</Text>
                  <Flex gap="4" align="center">
                    <Text color="gray">Uppercase</Text>
                    <Switch
                      checked={md5Uppercase}
                      onCheckedChange={setMd5Uppercase}
                    />
                  </Flex>
                </Flex>
                <Box position="relative">
                  <TextArea
                    readOnly
                    value={md5Uppercase ? md5String.toUpperCase() : md5String}
                  />
                  <Box position="absolute" top="2" right="2">
                    <Button
                      variant="soft"
                      size="2"
                      onClick={() => setHashPassword("")}
                    >
                      <ClipboardIcon size={16} strokeWidth={1} />
                    </Button>
                  </Box>
                </Box>
                <Text weight="medium">BCrypt</Text>
                <TextArea readOnly value={bcryptString} />
                <Text weight="medium">SHA256</Text>
                <TextArea readOnly value={sha256String} />
                <Text weight="medium">SHA512</Text>
                <TextArea readOnly rows={3} value={sha512String} />
                <Text weight="medium">Base64</Text>
                <TextArea readOnly rows={3} value={base64String} />
              </Flex>
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Box>
    </Theme>
  );
}

export default App;
