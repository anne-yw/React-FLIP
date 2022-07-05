import React from 'react'
import {useState, useEffect, useRef} from 'react'
import { FLIP_STATE, VISIBLE_STATE } from '../../constant/constant'
import './index.css'


export default function Items() {
  const requirePics = require.context("../../pics", true, /^\.\/.*\.jpg$/);
  const imgs = requirePics.keys().map(requirePics)

  const [flipState, setFlipState] = useState(FLIP_STATE.FIRST)
  const [visibleState, setVisibleState] = useState(VISIBLE_STATE.INIT)

  /* useRef 保存 UI 无关的状态，更新后不触发渲染 */
  const previewRef = useRef()
  const thumbnailRef = useRef()
  const scaleValue = useRef()
  // 记录动画 FIRST LAST 状态的元素位置信息，left, top
  const elementPosition = useRef({
    [FLIP_STATE.FIRST]: [0, 0],
    [FLIP_STATE.LAST]: [0, 0],
  })
  const previewedThumbnailInfo = useRef()
  const previewLoading = useRef(false)
  const translateOffset = useRef()

  useEffect(() => {
    // 图片加载后记录 LAST 状态信息
    function pictureLoaded() {
      previewLoading.current = false
      const previewPictureRect = this.getBoundingClientRect()
      elementPosition.current[FLIP_STATE.LAST] = [
        previewPictureRect.left,
        previewPictureRect.top,
      ]
      // 计算缩略图跟预览图的缩放比例，预览图是原始图片尺寸
      scaleValue.current =
        thumbnailRef.current.width / previewedThumbnailInfo.current.width
      // LAST -> INVERT
      setFlipState(FLIP_STATE.INVERT)
    }

    // 预览 + LAST
    if (
      flipState === FLIP_STATE.LAST &&
      visibleState === VISIBLE_STATE.PREVIEW
    ) {
      // 记录图片加载中状态，5s 后超时重置
      previewLoading.current = true
      setTimeout(() => {
        previewLoading.current = false
      }, 5000)
      // image 预览元素此时图片可能还未加载完，此时获取的是错误的位置信息，
      // 需要监听 load 事件后才能获取到正确的元素位置信息
      previewRef.current.addEventListener('load', pictureLoaded)
    }
    // INVERT -> PLAY
    else if (flipState === FLIP_STATE.INVERT) {
      // LAST 状态和 PLAY 结束后的状态，图片预览都是可见的，LAST -> INVERT -> PLAY 状态转换的时间过短时，
      // 浏览器会进行视图合并优化，直接渲染出预览图，而忽略了过渡的动效
      // 因此在 INVERT 状态后延迟一段时间再转换到 PLAY 状态，保证过渡动效
      setTimeout(() => setFlipState(FLIP_STATE.PLAY), 5)
    }
  }, [flipState, visibleState])

  function handlePreviewPicture(e) {
    const target = e.target
    if (target.tagName === 'LI') {
      // 记录 FIRST 状态信息
      const thumbnailRect = target.getBoundingClientRect()
      thumbnailRef.current = thumbnailRect
      elementPosition.current[FLIP_STATE.FIRST] = [
        thumbnailRect.left,
        thumbnailRect.top,
      ]
      const { imageWidth: width, imageSrc: src } = target.dataset
      previewedThumbnailInfo.current = { width, src }
      // FIRST -> LAST
      setFlipState(FLIP_STATE.LAST)
      setVisibleState(VISIBLE_STATE.PREVIEW)
    }
  }

  function handleClosePreview() {
    // 图片加载时忽略关闭预览
    if (previewLoading.current) return
    setVisibleState(VISIBLE_STATE.CLOSING)
    // 关闭预览的过渡动画直接从 INVERT 状态开始，因为 FIRST 和 LAST 状态的信息在之前已经记录
    setFlipState(FLIP_STATE.INVERT)
  }

  function handleTransitionEnd() {
    // 关闭预览过渡结束后重置状态
    if (visibleState === VISIBLE_STATE.CLOSING) {
      setVisibleState(VISIBLE_STATE.INIT)
      setFlipState(FLIP_STATE.FIRST)
      translateOffset.current = null
    }
  }

  // 预览PLAY 或者 关闭预览时开启过渡动效
  const enableTransition =
    (flipState === FLIP_STATE.PLAY && visibleState === VISIBLE_STATE.PREVIEW) ||
    visibleState === VISIBLE_STATE.CLOSING

  // 预览是否对用户可见，FLIP 最后一个状态才对用户可见
  const previewVisible = flipState === FLIP_STATE.PLAY

  // PREVIEW 或者 CLOSING 状态时显示预览
  const showPreview =
    visibleState === VISIBLE_STATE.PREVIEW ||
    visibleState === VISIBLE_STATE.CLOSING

  // INVERT 状态时计算 LAST 状态到 FIRST 状态的偏移量，反转到初始状态
  // 关闭预览时不必再重新计算
  if (flipState === FLIP_STATE.INVERT && !translateOffset.current) {
    const {
      [FLIP_STATE.FIRST]: firstState,
      [FLIP_STATE.LAST]: lastState,
    } = elementPosition.current
    const [firstX, firstY] = firstState
    const [lastX, lastY] = lastState
    translateOffset.current = [firstX - lastX, firstY - lastY]
  }

  // INVERT 或者 关闭预览时偏移到 FIRST 状态时的位置和尺寸（反转、还原）
  // 否则设置预览时的 transform（图片原始尺寸全屏居中）
  const transformStyle =
    flipState === FLIP_STATE.INVERT || visibleState === VISIBLE_STATE.CLOSING
      ? `translate3d(${translateOffset.current[0]}px, ${
          translateOffset.current[1]
        }px, 0) scale(${scaleValue.current})`
      : 'translate3d(0, 0, 0) scale(1)'
  
  return (
    
    <div className='container'>
        <ul className='pic-list' onClick={handlePreviewPicture}>
          {
            
            imgs.map((item, index)=>(
              
              <li
                key={index}
                
                data-image-src={item}
                data-image-width={200}//暂未解决
                className="pic-item"
                title="点击预览"
              >
                <img src={item} alt="" className="pic" />
                <div className='hidden-box'>picture{index}</div>
              </li>
              
            ))
          }
        </ul>
        {showPreview && (
          <div
            className="preview-box"
            onClick={handleClosePreview}
            style={{
              opacity: previewVisible ? 1 : 0,
            }}
          >
            {/* 原始尺寸图片预览 */}
            <img
              ref={previewRef}
              className={`img${enableTransition ? ' active' : ''}`}
              src={previewedThumbnailInfo.current.src}
              style={{
                transform: transformStyle,
                // 相对于 viewport 左上角缩放
                transformOrigin: '0 0',
              }}
              onClick={handleClosePreview}
              onTransitionEnd={handleTransitionEnd}
              alt=""
            />
          </div>
        )}
    </div>
  )
}
