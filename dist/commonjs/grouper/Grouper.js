"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DeltaInsertOp_1 = require("./../DeltaInsertOp");
require("./../extensions/Array");
var group_types_1 = require("./group-types");
var Grouper = (function () {
    function Grouper() {
    }
    Grouper.pairOpsWithTheirBlock = function (ops) {
        var result = [];
        var canBeInBlock = function (op) {
            return !(op.isJustNewline() || op.isVideo() || op.isContainerBlock());
        };
        var isInlineData = function (op) { return op.isInline(); };
        var lastInd = ops.length - 1;
        var opsSlice;
        for (var i = lastInd; i >= 0; i--) {
            var op = ops[i];
            if (op.isVideo()) {
                result.push(new group_types_1.VideoItem(op));
            }
            else if (op.isContainerBlock()) {
                opsSlice = ops._sliceFromReverseWhile(i - 1, canBeInBlock);
                result.push(new group_types_1.BlockGroup(op, opsSlice.elements));
                i = opsSlice.sliceStartsAt > -1 ? opsSlice.sliceStartsAt : i;
            }
            else {
                opsSlice = ops._sliceFromReverseWhile(i - 1, isInlineData);
                result.push(new group_types_1.InlineGroup(opsSlice.elements.concat(op)));
                i = opsSlice.sliceStartsAt > -1 ? opsSlice.sliceStartsAt : i;
            }
        }
        result.reverse();
        return result;
    };
    Grouper.groupConsecutiveSameStyleBlocks = function (groups, blocksOf) {
        if (blocksOf === void 0) { blocksOf = {
            header: true,
            codeBlocks: true,
            blockquotes: true
        }; }
        return groups._groupConsecutiveElementsWhile(function (g, gPrev) {
            if (!(g instanceof group_types_1.BlockGroup) || !(gPrev instanceof group_types_1.BlockGroup)) {
                return false;
            }
            return blocksOf.codeBlocks && Grouper.areBothCodeblocks(g, gPrev)
                || blocksOf.blockquotes && Grouper.areBothBlockquotesWithSameAdi(g, gPrev)
                || blocksOf.header && Grouper.areBothSameHeadersWithSameAdi(g, gPrev);
        });
    };
    Grouper.reduceConsecutiveSameStyleBlocksToOne = function (groups) {
        var newLineOp = DeltaInsertOp_1.DeltaInsertOp.createNewLineOp();
        return groups.map(function (elm) {
            if (!Array.isArray(elm)) {
                if (elm instanceof group_types_1.BlockGroup && !elm.ops.length) {
                    elm.ops.push(newLineOp);
                }
                return elm;
            }
            var groupsLastInd = elm.length - 1;
            elm[0].ops = elm.map(function (g, i) {
                if (!g.ops.length) {
                    return [newLineOp];
                }
                return g.ops.concat(i < groupsLastInd ? [newLineOp] : []);
            })._flatten();
            return elm[0];
        });
    };
    Grouper.areBothCodeblocks = function (g1, gOther) {
        return g1.op.isCodeBlock() && gOther.op.isCodeBlock();
    };
    Grouper.areBothSameHeadersWithSameAdi = function (g1, gOther) {
        return g1.op.isSameHeaderAs(gOther.op) && g1.op.hasSameAdiAs(gOther.op);
    };
    Grouper.areBothBlockquotesWithSameAdi = function (g, gOther) {
        return g.op.isBlockquote() && gOther.op.isBlockquote()
            && g.op.hasSameAdiAs(gOther.op);
    };
    return Grouper;
}());
exports.Grouper = Grouper;
