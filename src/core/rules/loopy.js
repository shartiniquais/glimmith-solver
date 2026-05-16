import { allVertexBorderDegrees } from "../boundary.js";

export const loopyRule = {
  id: "loopy",
  label: "Loopy",
  scope: "boundary_graph",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {},

  addConstraints(model, context) {
    model.addSelectionValidator((selectedCandidates, state) => {
      if (!state?.complete) return true;
      return !allVertexBorderDegrees(selectedCandidates, context.puzzle).some((vertex) => vertex.degree === 3);
    });
  }
};
