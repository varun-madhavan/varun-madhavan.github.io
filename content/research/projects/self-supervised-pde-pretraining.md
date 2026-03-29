## Project Overview
This work explored self-supervised learning for foundational neural PDE solvers. Instead of training from scratch for each system, the goal was to pre-train a model that generalizes across dynamics and can generate full trajectories from initial states.

## What We Built
- Decomposed simulation trajectories into temporal patches.
- Trained an autoregressive transformer to predict future patches from historical context.
- Evaluated cross-trajectory and cross-parameter generalization on PDEBench systems.

## Why It Matters
General-purpose PDE priors can reduce data and compute requirements when adapting to new physical systems.
