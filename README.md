# jsdice

🇬🇧
A powerful and flexible TypeScript library for simulating dice rolls, inspired by Discord bots like "Rollem". It supports a wide range of modifiers, including keep/drop, rerolls, and exploding dice.

---
🇧🇷
Uma biblioteca TypyScript poderosa e flexível para simulação de rolagem de dados, inspirada principalmente por bots do Discord como "Rollem". Ela suporta uma vasta gama de modificadores, incluindo manter/descartar (keep/drop), rerrolagens e explosões de dados.

---



## 📖 Table of Contents (Índice)
- [jsdice](#jsdice)
  - [📖 Table of Contents (Índice)](#-table-of-contents-índice)
  - [🇬🇧 English Documentation](#-english-documentation)
    - [Installation](#installation)
    - [Basic Usage](#basic-usage)
    - [API Reference](#api-reference)
      - [`roll(notation)`](#rollnotation)
      - [`countSuccesses(notation, condition)`](#countsuccessesnotation-condition)
    - [Dice Notation Modifiers](#dice-notation-modifiers)
  - [🇧🇷 Documentação em Português](#-documentação-em-português)
    - [Instalação](#instalação)
    - [Uso Básico](#uso-básico)
    - [Referência da API](#referência-da-api)
      - [`roll(notacao)`](#rollnotacao)
      - [`countSuccesses(notacao, condicao)`](#countsuccessesnotacao-condicao)
    - [Modificadores de Notação](#modificadores-de-notação)

---

## 🇬🇧 English Documentation

### Installation

```bash
npm install @cassracp/jsdice
```

### Basic Usage

The library exports two main functions: `roll` and `countSuccesses`.

```typescript
import { roll, countSuccesses } from 'jsdice';

// Get the total of a complex roll
const results = roll('4d6kh3!+5');
const firstResult = results[0];
console.log(`Rolled [${firstResult.rolls.join(', ')}] for a total of ${firstResult.total}`);
// Example output: Rolled [6, 5, 4] for a total of 20

// Count successes in a pool of dice
const successResults = countSuccesses('10d6', '>=5');
const firstSuccessResult = successResults[0];
console.log(`You got ${firstSuccessResult.successCount} successes! [${firstSuccessResult.rolls.join(', ')}]`);
// Example output: You got 4 successes! [5, 2, 6, 1, 4, 6, 3, 5, 1, 6]
```

### API Reference

#### `roll(notation)`
Evaluates a dice notation string and returns an array of detailed results.

- **`notation`**: `string` - The dice notation string (e.g., `"2d10+5"`). Can contain multiple expressions separated by commas (e.g., `"1d20, 3d6-2"`).
- **Returns**: `RollResult[]` - An array of result objects.

**`RollResult` Object:**
```typescript
{
  notation: string; // The original notation for this part of the roll
  total: number;    // The final sum, including all modifiers
  rolls: number[];  // The final set of dice used to calculate the total
}
```

#### `countSuccesses(notation, condition)`
Rolls dice and counts how many individual dice meet a specific condition.

- **`notation`**: `string` - The dice notation string, which is evaluated first.
- **`condition`**: `string` - The condition to check for success (e.g., `">5"`, `"<3"`, `"=6"`).
- **Returns**: `SuccessCountResult[]` - An array of success-counting result objects.

**`SuccessCountResult` Object:**
```typescript
{
  notation: string;     // The original notation for this part of the roll
  successCount: number; // The number of dice that met the condition
  rolls: number[];      // The final set of dice that were checked
}
```

### Dice Notation Modifiers

Modifiers are appended to a standard `XdY` roll (e.g., `4d6`).

| Modifier | Name | Example | Description |
| :--- | :--- | :--- | :--- |
| `kh` | **Keep Highest** | `4d6kh3` | Rolls 4d6 and keeps the 3 highest dice. |
| `kl` | **Keep Lowest** | `4d6kl3` | Rolls 4d6 and keeps the 3 lowest dice. |
| `dh` | **Drop Highest** | `4d6dh1` | Rolls 4d6 and drops the single highest die. |
| `dl` | **Drop Lowest** | `4d6dl1` | Rolls 4d6 and drops the single lowest die. |
| `r` | **Reroll** | `2d10r<3` | Rolls 2d10 and rerolls any die that is less than 3 *once*. |
| `L` | **Limit (Reroll)** | `10d6r=1L3` | Rerolls on a 1, but only up to a maximum of 3 dice from the set. |
| `!` | **Explode** | `3d6!` | Rolls 3d6. If any die is a 6 (max value), roll it again and add it to the pool. |
| `!>=` | **Conditional Explode** | `5d10!>=8` | Rolls 5d10. Any die that is 8 or higher explodes. |
| `L` | **Limit (Explode)** | `3d6!L1` | Each die can only explode a maximum of 1 time. |
| `+`/`-` | **Modifier** | `1d20+5` | Adds or subtracts a flat number from the total. |

---

## 🇧🇷 Documentação em Português

### Instalação

```bash
npm install @cassracp/jsdice
```

### Uso Básico

A biblioteca exporta duas funções principais: `roll` e `countSuccesses`.

```typescript
import { roll, countSuccesses } from 'jsdice';

// Obter o total de uma rolagem complexa
const results = roll('4d6kh3!+5');
const firstResult = results[0];
console.log(`Rolou [${firstResult.rolls.join(', ')}] para um total de ${firstResult.total}`);
// Exemplo de saída: Rolou [6, 5, 4] para um total de 20

// Contar sucessos em um conjunto de dados
const successResults = countSuccesses('10d6', '>=5');
const firstSuccessResult = successResults[0];
console.log(`Você obteve ${firstSuccessResult.successCount} sucessos! [${firstSuccessResult.rolls.join(', ')}]`);
// Exemplo de saída: Você obteve 4 sucessos! [5, 2, 6, 1, 4, 6, 3, 5, 1, 6]
```

### Referência da API

#### `roll(notacao)`
Avalia uma string de notação de dados e retorna um array de resultados detalhados.

- **`notacao`**: `string` - A string de notação (ex: `"2d10+5"`). Pode conter múltiplas expressões separadas por vírgula (ex: `"1d20, 3d6-2"`).
- **Retorna**: `RollResult[]` - Um array de objetos de resultado.

**Objeto `RollResult`:**
```typescript
{
  notation: string; // A notação original para esta parte da rolagem
  total: number;    // A soma final, incluindo todos os modificadores
  rolls: number[];  // O conjunto final de dados usado para calcular o total
}
```

#### `countSuccesses(notacao, condicao)`
Rola os dados e conta quantos dados individuais atendem a uma condição específica.

- **`notacao`**: `string` - A string de notação de dados, que é avaliada primeiro.
- **`condicao`**: `string` - A condição para verificar o sucesso (ex: `">5"`, `"<3"`, `"=6"`).
- **Retorna**: `SuccessCountResult[]` - Um array de objetos de resultado da contagem de sucessos.

**Objeto `SuccessCountResult`:**
```typescript
{
  notation: string;     // A notação original para esta parte da rolagem
  successCount: number; // O número de dados que atendeu à condição
  rolls: number[];      // O conjunto final de dados que foi verificado
}
```

### Modificadores de Notação

Os modificadores são adicionados a uma rolagem padrão `XdY` (ex: `4d6`).

| Modificador | Nome | Exemplo | Descrição |
| :--- | :--- | :--- | :--- |
| `kh` | **Manter Maiores** | `4d6kh3` | Rola 4d6 e mantém os 3 dados mais altos. |
| `kl` | **Manter Menores** | `4d6kl3` | Rola 4d6 e mantém os 3 dados mais baixos. |
| `dh` | **Descartar Maiores** | `4d6dh1` | Rola 4d6 e descarta o dado mais alto. |
| `dl` | **Descartar Menores** | `4d6dl1` | Rola 4d6 e descarta o dado mais baixo. |
| `r` | **Rerrolar** | `2d10r<3` | Rola 2d10 e rerrola *uma vez* qualquer dado que seja menor que 3. |
| `L` | **Limite (Rerolagem)** | `10d6r=1L3` | Rerrola se o resultado for 1, mas no máximo 3 dados do conjunto. |
| `!` | **Explodir** | `3d6!` | Rola 3d6. Se qualquer dado for 6 (valor máx.), role-o novamente e adicione ao total. |
| `!>=` | **Explosão Condicional** | `5d10!>=8` | Rola 5d10. Qualquer dado com resultado 8 ou maior explode. |
| `L` | **Limite (Explosão)** | `3d6!L1` | Cada dado pode explodir no máximo 1 vez. |
| `+`/`-` | **Modificador** | `1d20+5` | Adiciona ou subtrai um número fixo do total. |
