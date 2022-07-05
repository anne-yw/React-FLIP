// FLIP 四个状态
const FLIP_STATE = {
FIRST: Symbol('FIRST'),
LAST: Symbol('LAST'),
INVERT: Symbol('INVERT'),
PLAY: Symbol('PLAY'),
}

// 元素可视化状态
const VISIBLE_STATE = {
// 缩略图
INIT: Symbol('INIT'),
// 预览
PREVIEW: Symbol('PREVIEW'),
// 关闭预览
CLOSING: Symbol('CLOSING'),
}

export  {
    FLIP_STATE,
    VISIBLE_STATE
}