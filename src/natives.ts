import { invoke } from "@tauri-apps/api/core";

export interface AnalyzedResult {
  password: string;
  length: number;
  spaces_count: number;
  numbers_count: number;
  lowercase_letters_count: number;
  uppercase_letters_count: number;
  symbols_count: number;
  other_characters_count: number;
  consecutive_count: number;
  non_consecutive_count: number;
  progressive_count: number;
  is_common: boolean;
  crack_times?: string;
  score: number;
}

export interface Complexity {
  length: number;
  symbols: boolean;
  numbers: boolean;
  uppercase: boolean;
  lowercase: boolean;
  spaces: boolean;
  excludeSimilarCharacters: boolean;
  strict: boolean;
}

const generatePassword = async (options: Complexity): Promise<string> => {
  return await invoke("gen_password", { ...options });
};

const generateWords = async (
  length: number,
  fullWords: boolean
): Promise<string[]> => {
  return await invoke("gen_words", {
    length,
    fullWords,
  });
};

const generatePin = async (length: number): Promise<string> => {
  return await invoke("gen_pin", {
    length,
  });
};

const analyze = async (password: string): Promise<AnalyzedResult> => {
  return await invoke("analyze", {
    password,
  });
};

const score = async (password: string): Promise<number> => {
  return await invoke("score", {
    password,
  });
};

const crackTimes = async (password: string): Promise<string> => {
  return await invoke("crack_times", {
    password,
  });
};

const md5 = async (password: string): Promise<string> => {
  return await invoke("md5", {
    password,
  });
};

const base64 = async (password: string): Promise<string> => {
  return await invoke("base64", {
    password,
  });
};

const bcrypt = async (password: string, rounds: number): Promise<string> => {
  return await invoke("bcrypt", {
    password,
    rounds,
  });
};

const sha1 = async (password: string): Promise<string> => {
  return await invoke("sha1", {
    password,
  });
};

const sha224 = async (password: string): Promise<string> => {
  return await invoke("sha224", {
    password,
  });
};

const sha256 = async (password: string): Promise<string> => {
  return await invoke("sha256", {
    password,
  });
};

const sha384 = async (password: string): Promise<string> => {
  return await invoke("sha384", {
    password,
  });
};

const sha512 = async (password: string): Promise<string> => {
  return await invoke("sha512", {
    password,
  });
};

export default {
  generatePassword,
  generateWords,
  generatePin,
  score,
  crackTimes,
  analyze,
  md5,
  bcrypt,
  base64,
  sha1,
  sha224,
  sha256,
  sha384,
  sha512,
};
