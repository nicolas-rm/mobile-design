// Executes layout with the exact Yoga sources shipped by the installed RN.
// Geometry only: glyph/text measurements enter as explicit test fixtures.
#include <yoga/Yoga.h>
#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <map>
#include <sstream>
#include <string>

struct IntrinsicSize { float width; float height; };

// RN Text measures against Yoga's actual loose/exact constraints. An intrinsic
// metric is input data, not a width style that can defeat those constraints.
static YGSize measureIntrinsic(YGNodeConstRef node, float width, YGMeasureMode widthMode,
                               float height, YGMeasureMode heightMode) {
  const auto* size = static_cast<IntrinsicSize*>(YGNodeGetContext(node));
  const float measuredWidth = widthMode == YGMeasureModeExactly ? width
      : widthMode == YGMeasureModeAtMost ? std::min(size->width, width) : size->width;
  const float measuredHeight = heightMode == YGMeasureModeExactly ? height
      : heightMode == YGMeasureModeAtMost ? std::min(size->height, height) : size->height;
  return { measuredWidth, measuredHeight };
}

int main(int argc, char* argv[]) {
  auto config = YGConfigNew();
  YGConfigSetErrata(config, YGErrataAll); // Fabric YogaLayoutableShadowNode default.
  YGConfigSetPointScaleFactor(config, 3);
  std::map<int, YGNodeRef> nodes;
  std::map<int, int> parents;
  std::map<int, IntrinsicSize> intrinsicSizes;
  std::string line;
  while (std::getline(std::cin, line)) {
    std::istringstream input(line);
    std::string command;
    input >> command;
    if (command == "node") {
      int id, parent;
      input >> id >> parent;
      auto node = YGNodeNewWithConfig(config);
      nodes[id] = node;
      parents[id] = parent;
      if (parent >= 0) YGNodeInsertChild(nodes.at(parent), node, YGNodeGetChildCount(nodes.at(parent)));
    } else if (command == "measure") {
      int id;
      float width, height;
      input >> id >> width >> height;
      intrinsicSizes[id] = { width, height };
      YGNodeSetContext(nodes.at(id), &intrinsicSizes.at(id));
      YGNodeSetMeasureFunc(nodes.at(id), measureIntrinsic);
    } else if (command == "style") {
      int id;
      std::string property, value;
      input >> id >> property >> value;
      auto node = nodes.at(id);
      const float number = std::strtof(value.c_str(), nullptr);
      const bool percent = value.ends_with('%');
      if (property == "width") {
        if (value == "max-content") YGNodeStyleSetWidthMaxContent(node);
        else if (value == "auto") YGNodeStyleSetWidthAuto(node);
        else if (percent) YGNodeStyleSetWidthPercent(node, number);
        else YGNodeStyleSetWidth(node, number);
      }
      else if (property == "height") { if (percent) YGNodeStyleSetHeightPercent(node, number); else YGNodeStyleSetHeight(node, number); }
      else if (property == "minWidth") YGNodeStyleSetMinWidth(node, number);
      else if (property == "minHeight") YGNodeStyleSetMinHeight(node, number);
      else if (property == "maxWidth") { if (percent) YGNodeStyleSetMaxWidthPercent(node, number); else YGNodeStyleSetMaxWidth(node, number); }
      else if (property == "flex") YGNodeStyleSetFlex(node, number);
      else if (property == "flexGrow") YGNodeStyleSetFlexGrow(node, number);
      else if (property == "flexShrink") YGNodeStyleSetFlexShrink(node, number);
      else if (property == "gap") YGNodeStyleSetGap(node, YGGutterAll, number);
      else if (property == "position" && value == "absolute") YGNodeStyleSetPositionType(node, YGPositionTypeAbsolute);
      else if (property == "position" && value == "relative") YGNodeStyleSetPositionType(node, YGPositionTypeRelative);
      else if (property == "direction") YGNodeStyleSetDirection(node, value == "rtl" ? YGDirectionRTL : YGDirectionLTR);
      else if (property == "formsContainingBlock") YGNodeSetAlwaysFormsContainingBlock(node, true);
      else if (property == "flexDirection") YGNodeStyleSetFlexDirection(node, value == "row" ? YGFlexDirectionRow : value == "row-reverse" ? YGFlexDirectionRowReverse : YGFlexDirectionColumn);
      else if (property == "alignItems" || property == "alignSelf") {
        const auto align = value == "center" ? YGAlignCenter : value == "flex-start" ? YGAlignFlexStart : value == "flex-end" ? YGAlignFlexEnd : value == "auto" ? YGAlignAuto : YGAlignStretch;
        if (property == "alignItems") YGNodeStyleSetAlignItems(node, align); else YGNodeStyleSetAlignSelf(node, align);
      } else if (property == "justifyContent") {
        YGNodeStyleSetJustifyContent(node, value == "center" ? YGJustifyCenter : value == "flex-end" ? YGJustifyFlexEnd : value == "space-around" ? YGJustifySpaceAround : value == "space-between" ? YGJustifySpaceBetween : YGJustifyFlexStart);
      } else {
        YGEdge edge = YGEdgeAll;
        std::string suffix = property;
        bool padding = property.starts_with("padding");
        bool margin = property.starts_with("margin");
        if (padding) suffix = property.substr(7);
        if (margin) suffix = property.substr(6);
        if (suffix == "Left" || suffix == "left") edge = YGEdgeLeft;
        else if (suffix == "Right" || suffix == "right") edge = YGEdgeRight;
        else if (suffix == "Top" || suffix == "top") edge = YGEdgeTop;
        else if (suffix == "Bottom" || suffix == "bottom") edge = YGEdgeBottom;
        else if (suffix == "Horizontal") edge = YGEdgeHorizontal;
        else if (suffix == "Vertical") edge = YGEdgeVertical;
        else if (suffix == "Start") edge = YGEdgeStart;
        else if (suffix == "End") edge = YGEdgeEnd;
        if (padding) YGNodeStyleSetPadding(node, edge, number);
        else if (margin) YGNodeStyleSetMargin(node, edge, number);
        else if (property == "left" || property == "right" || property == "top" || property == "bottom" || property == "inset") {
          if (percent) YGNodeStyleSetPositionPercent(node, edge, number); else YGNodeStyleSetPosition(node, edge, number);
        }
      }
    }
  }
  const auto rootDirection = argc > 1 && std::string(argv[1]) == "rtl" ? YGDirectionRTL : YGDirectionLTR;
  YGNodeCalculateLayout(nodes.at(0), YGUndefined, YGUndefined, rootDirection);
  for (const auto& [id, node] : nodes) std::cout << id << ' ' << parents[id] << ' ' << YGNodeLayoutGetLeft(node) << ' ' << YGNodeLayoutGetTop(node) << ' ' << YGNodeLayoutGetWidth(node) << ' ' << YGNodeLayoutGetHeight(node) << '\n';
  YGNodeFreeRecursive(nodes.at(0));
  YGConfigFree(config);
}
