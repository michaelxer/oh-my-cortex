# NOTICE

This directory contains a **community compatibility adapter** for
[oh-my-cortex](https://github.com/michaelxer/oh-my-cortex), written to run the V1 plugin on
OpenCode V2.

- It is not part of the original oh-my-cortex distribution.
- It does not modify oh-my-cortex source code; it imports the published `dist/index.js` at runtime.
- It is a derivative work distributed under the Sustainable Use License 1.0 (SUL-1.0).
- Modifications: new adapter entrypoint, V1-to-V2 hook translation, V1 client shim, and install
  scripts. The generated agent templates are derived from prompts emitted by oh-my-cortex.
- The original copyright and license notices are retained in the repository `LICENSE.md`.

Provided free of charge for non-commercial use, in accordance with SUL-1.0.
