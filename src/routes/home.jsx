import { Suspense, useState, useEffect, useRef } from 'react'
import { useLoaderData, defer, Form, Await, useRouteError, Link, useNavigate } from 'react-router-dom'
import { Title } from './helper/DocumentTitle'
import Icon from './helper/MaterialIcon'
import Shimmer from './helper/Shimmer'
import { getTournamentList } from './../util/api'
import toast, { Toaster } from 'react-hot-toast'
import Heading from './helper/Heading'
import { useAuth, contracts, getDefaultChain } from './../contexts/AuthContext'
import Logo from './../../src/assets/logo.svg'
import Cat from './../../src/assets/cat.svg'
import party from 'party-js'
import styles from './Home.module.scss'
import { PinataSDK } from 'pinata'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { SVG as SVGJS } from '@svgdotjs/svg.js'
import '@svgdotjs/svg.select.js'
import '@svgdotjs/svg.resize.js'
import Web3 from 'web3'
const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_API_KEY,
  pinataGateway: 'example-gateway.mypinata.cloud',
})

party.resolvableShapes['logo'] = `<img src="${Logo}" style='width:24px'/>`

let isMouseDown = false
export const loader = async () => {
  return defer({ key: 'val' })
}

function Home({ title }) {
  Title(title)
  const [loaderData, setLoaderData] = useState(useLoaderData())
  const [isLoading, setIsLoading] = useState(true)
  const [showArtboard, setShowArtboard] = useState(false)
  const [color, setColor] = useState(``)
  const [assetname, setAssetname] = useState(``)
  const [description, setDescription] = useState(``)
  const [count, setCount] = useState(1)
  const [selectedFile, setSelectedFile] = useState()
  const [stage1Token, setStage1Token] = useState([])
  const [layer, setLayer] = useState({ layers: [] })
  const auth = useAuth()
  const SVG = useRef()
  const navigate = useNavigate()
  const txtSearchRef = useRef()
  const SVGpreview = useRef()
  let selectedElement, offset

  const handleSearch = async () => {
    if (txtSearchRef.current.value.length < 3) {
      toast.error(`A name must be a minimum of 3 characters long.`)
      return
    }

    const t = toast.loading(`Searching`)

    contract.methods
      .toNodehash(txtSearchRef.current.value, selectedRecordType)
      .call()
      .then(async (res) => {
        console.log(res)
        await contract.methods
          ._freeToRegister(res)
          .call()
          .then((res) => {
            console.log(res)
            setFreeToRegister(!res)
            toast.dismiss(t)
          })
      })
  }

  const fetchIPFS = async (CID) => {
    try {
      const response = await fetch(`https://api.universalprofile.cloud/ipfs/${CID}`)
      if (!response.ok) throw new Response('Failed to get data', { status: 500 })
      const json = await response.json()
      // console.log(json)
      return json
    } catch (error) {
      console.error(error)
    }

    return false
  }

  const getMintPrice = async () => {
    const web3 = new Web3(getDefaultChain() === `LUKSO` ? window.lukso : window.ethereum)
    const contract = new web3.eth.Contract(contracts[0].abi, contracts[0].contract_address)
    return await contract.methods.fee(`mint_price`).call()
  }

  const rAsset = async (imageURL) => {
    const assetBuffer = await fetch(imageURL).then(async (response) => {
      return response.arrayBuffer().then((buffer) => new Uint8Array(buffer))
    })

    return assetBuffer
  }

  const copy = async () => {
    document.querySelectorAll(`#artboardSVG rect`).forEach((item) => {
      let modified = item.getAttribute(`modified`)
      if (modified === false) {
        item.style.fill = `transparent`
      }
    })
    try {
      const type = 'text/plain'
      const blob = new Blob([document.querySelector(`#artboardSVG`).outerHTML], { type })
      const data = [new ClipboardItem({ [type]: blob })]
      await navigator.clipboard.write(data)
      toast(`Copied`)
    } catch (error) {
      console.error(error.message)
    }
  }

  const download = () => {
    document.querySelectorAll(`.${styles['board']} rect`).forEach((item) => {
      let modified = item.getAttribute(`modified`)
      if (!modified) {
        // item.remove()
        item.style.fill = `transparent`
      }
    })
    const htmlStr = document.querySelector(`#artboardSVG`).outerHTML
    const blob = new Blob([htmlStr], { type: 'image/svg+xml' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('download', 'Masterpix.svg')
    a.setAttribute('href', url)
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const updatePreview = () => {
    // Update
    SVGpreview.current.innerHTML = SVG.current.innerHTML
    // ToDo: reading in page load doesnt work, need to add events to each rect.
    localStorage.setItem(`svg`, SVG.current.innerHTML)
  }

  const add = () => {
    if (layer.layers.filter((item) => item === `artboardLayer`).length > 0) {
      toast.error(`The artboard has already been created.`)
      return
    }
    setShowArtboard(true)
    rect()
    toast.success(`Artboard has been created`, { icon: `🖌️` })
    localStorage.removeItem(`draw`)
    updatePreview()
  }

  const draw = (e) => {
    let color = document.querySelector(`input[type='color']`).value
    if (e.button === 2) {
      color = `transparent` //e.target.getAttribute(`default-color`)
      isMouseDown = false
      e.target.setAttribute(`modified`, false)
    }
    if (e.button === 0 && isMouseDown && e.type === `mouseenter`) {
      e.target.style.fill = color || `red`
      e.target.setAttribute(`modified`, e.button === 2 ? false : true)
    } else if ((e.button === 0 && e.type === `click`) || e.type === `mousedown`) {
      e.target.style.fill = color || `red`
      e.target.setAttribute(`modified`, e.button === 2 ? false : true)
    }

    // Save draw
    const innerSVG = SVG.innerHTML
    localStorage.setItem(`draw`, innerSVG)

    // Update preview
    updatePreview()
  }

  const clear = () => {
    document.querySelectorAll(`.${styles['board']} rect`).forEach((item) => {
      item.style.fill = item.getAttribute(`default-color`)
      item.setAttribute(`modified`, false)
    })
    toast.success(`Artboard has been cleared`, { icon: `🧹` })

    // Update preview
    updatePreview()
  }

  const rect = () => {
    //document.querySelector(`#artboardSVG`).innerHTML = ''
    const countX = document.querySelector(`#x`).value
    const countY = document.querySelector(`#y`).value
    let width = 400 / countX
    let height = 400 / countY
    let colors = [`#F1F1F1`, `#D9D9D9`]
    let colorIndex = false
    console.log(`Width: ${width} | Height: ${height}`)

    const svgns = 'http://www.w3.org/2000/svg'
    const group = document.createElementNS(svgns, 'g')
    group.setAttribute('name', `artboardLayer`)
    setLayer({ layers: [...layer.layers, `artboardLayer`] })

    for (let y = 0; y < countY; y++) {
      for (let x = 0; x < countX; x++) {
        let rect = document.createElementNS(svgns, 'rect')
        rect.setAttribute('x', x * width)
        rect.setAttribute('y', y * height)
        rect.setAttribute('height', height)
        rect.setAttribute('width', width)
        rect.setAttribute('fill', colorIndex ? colors[0] : colors[1])
        rect.setAttribute('default-color', colorIndex ? colors[0] : colors[1])
        rect.onmouseenter = (e) => draw(e)
        rect.onmousedown = (e) => draw(e)

        group.appendChild(rect)
        // stroke={`red`} strokeOpacity={0.1} strokeWidth={1} key={`x${x}y${y}`}
        colorIndex = !colorIndex
      }
      colorIndex = !colorIndex
    }
    // Add rect group to SVG
    SVG.current.appendChild(group)
  }

  const changeHandler = (e) => {
    setSelectedFile(event.target.files[0])
  }

  const tokenURI = async () => {
    if (selectedFile) {
      try {
        const t = toast.loading(`Uploading to IPFS`)
        const upload = await pinata.upload.file(selectedFile)
        console.log(upload)
        toast.dismiss(t)
        return upload.IpfsHash
      } catch (error) {
        console.log(error)
      }
    } else {
      document.querySelectorAll(`.${styles['board']} rect`).forEach((item) => {
        let modified = item.getAttribute(`modified`)
        if (!modified) {
          // item.remove()
          item.style.fill = `transparent`
        }
      })

      const htmlStr = document.querySelector(`.${styles['board']} svg`).outerHTML
      const blob = new Blob([htmlStr], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)

      try {
        const t = toast.loading(`Uploading to IPFS`)
        const file = new File([blob], 'test.svg', { type: blob.type })
        const upload = await pinata.upload.file(file)
        console.log(upload)
        toast.dismiss(t)
        return upload.IpfsHash
      } catch (error) {
        console.log(error)
      }
    }
    //  })
    // const svg = `${document.querySelector(`#artboardSVG`).outerHTML}`;
    // console.log(svg)
    // return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
  }

  const mint = async () => {
    if (document.querySelector(`#artboardSVG`).innerHTML === '' && selectedFile === undefined) {
      toast.error(`Please draw or choose a file`)
      return false
    }

    if (!auth.wallet) {
      auth.connectWallet()
      return
    }

    const web3 = new Web3(getDefaultChain() === `LUKSO` ? window.lukso : window.ethereum)
    const t = toast.loading(`Waiting for transaction's confirmation`)
    try {
      const imageUrl = await tokenURI()
      let rawMetadata

      if (auth.defaultChain === 'LUKSO') {
        const tConvert = toast.loading(`Generating metadata...please wait`)
        rAsset(`https://ipfs.io/ipfs/${imageUrl}`).then((result) => {
          toast.dismiss(tConvert)
          console.log(result)
          console.log(`Verifiable URL`, web3.utils.keccak256(result))
          rawMetadata = web3.utils.toHex({
            LSP4Metadata: {
              name: assetname,
              description: `${description}`,
              links: [
                { title: 'Website', url: 'https://masterpix.art/' },
                { title: 'Mint', url: 'https://masterpix.art/' },
                { title: '𝕏', url: 'https://x.com/ArattaLabsDev' },
                { title: 'Telegram', url: 'https://t.me/arattalabs' },
              ],
              attributes: [{ key: 'Version', value: 1 }],
              icon: [{ width: 500, height: 500, url: 'ipfs://QmWpSVntG9Mmk9CHczf9ZACKDTuQMVUedEDcCdwwbqBs9b', verification: { method: 'keccak256(bytes)', data: '0xe303725c7fa6e0c8741376085a3859d858eb4d188afa6402bb39d34f40e5ed3f' } }],
              backgroundImage: [
                {
                  width: 1601,
                  height: 401,
                  url: 'ipfs://QmcTYAQmt7ZPbzR6w3XXzGwgfEu4zU2T4LLukqLBvJg2Eg',
                  verification: {
                    method: 'keccak256(bytes)',
                    data: '0x0fd8498ada7a39b1eb9f6ed54adc8950a84d5d79ad8418eb46fbcaf6a5c9638b',
                  },
                },
              ],
              assets: [],
              images: [[{ width: 500, height: 500, url: `ipfs://${imageUrl}`, verification: { method: 'keccak256(bytes)', data: web3.utils.keccak256(result) } }]],
            },
          })

          // mint
          const contract = new web3.eth.Contract(contracts[0].abi, contracts[0].contract_address)
          contract.methods
            .mint(rawMetadata, count)
            .send({
              from: auth.wallet,
              value: web3.utils.toWei(1, `ether`),
            })
            .then((res) => {
              console.log(res) //res.events.tokenId

              // Run partyjs
              party.confetti(document.querySelector(`header`), {
                count: party.variation.range(20, 40),
                shapes: ['logo'],
              })

              toast.success(`Transaction has been confirmed! Check out your NFTs`)
              toast.dismiss(t)
            })
            .catch((error) => {
              console.log(error)
              toast.dismiss(t)
            })
        })
      } else if (auth.defaultChain === 'Arbitrum') {
        const json = { name: assetname, description: description, image: `https://ipfs.io/ipfs/${imageUrl}`, version: '1' }
        rawMetadata = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(json))))

        // mint
        const contract = new web3.eth.Contract(contracts[1].abi, contracts[1].contract_address)
        contract.methods
          .mint(rawMetadata, count)
          .send({
            from: auth.wallet,
            value: web3.utils.toWei(1, `ether`),
          })
          .then((res) => {
            console.log(res) //res.events.tokenId

            // Run partyjs
            party.confetti(document.querySelector(`header`), {
              count: party.variation.range(20, 40),
              shapes: ['logo'],
            })

            toast.success(`Transaction has been confirmed! Check out your NFTs`)
            toast.dismiss(t)
          })
          .catch((error) => {
            console.log(error)
            toast.dismiss(t)
          })
      }
    } catch (error) {
      console.log(error)
      toast.dismiss(t)
    }
  }

  function getMousePosition(evt) {
    var CTM = SVG.current.getScreenCTM()
    if (evt.touches) {
      evt = evt.touches[0]
    }
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d,
    }
  }

  const deleteLayer = (groupName) => {
    SVG.current.querySelector(`SVG [name="${groupName}"]`).remove()
    setLayer({ layers: [...layer.layers.filter((item) => item !== groupName)] })

    // Update preview
    updatePreview()
  }

  const changeScale = (e, groupName) => {
    SVG.current.querySelector(`SVG [name="${groupName}"]`).setAttribute('transform', `scale(${e.target.value})`)
    // Update preview
    updatePreview()
  }

  const changeDimension = (e, type, groupName) => {
    let elem,
      value = e.target.value

    if (groupName === `artboardLayer`) elem = SVG.current.querySelector(`SVG [name="${groupName}"]`)
    else elem = SVG.current.querySelector(`SVG [name="${groupName}"] image`)

    if (type === `width`) elem.setAttribute(`width`, value)
    else if (type === `height`) elem.setAttribute(`height`, value)

    // Update preview
    updatePreview()
  }

  const addLayer = (url, name) => {
    // Conver image URL/ IPFS CID to blob
    fetch(`${url}`)
      .then((response) => response.blob())
      .then((blob) => {
        // const url = URL.createObjectURL(blob)

        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = function () {
          const base64data = reader.result

          const svgns = 'http://www.w3.org/2000/svg'
          const group = document.createElementNS(svgns, 'g')
          group.setAttribute('name', `${name}Layer${layer.layers.length + 1}`)
          setLayer({ layers: [...layer.layers, `${name}Layer${layer.layers.length + 1}`] })

          const image = document.createElementNS(svgns, 'image')
          let draggable = false
          image.setAttribute('href', base64data)
          image.setAttribute('width', 400)
          image.setAttribute('height', 400)
          image.setAttribute('x', 0)
          image.setAttribute('y', 0)
          image.style.cursor = `move`
          image.addEventListener(`mousedown`, (evt) => startDrag(evt, image))
          image.addEventListener(`mousemove`, (evt) => drag(evt, image))
          image.addEventListener(`mouseup`, (evt) => endDrag(evt, image))
          image.addEventListener(`mouseleave`, (evt) => endDrag(evt, image))

          // Add image to SVG
          group.appendChild(image)
          SVG.current.appendChild(group)

          // SVGJS(group)

          // Update preview
          updatePreview({ layers: [...layer.layers, `${name}Layer${layer.layers.length + 1}`] })
        }
      })
  }

  const startDrag = (evt, image) => {
    selectedElement = evt
    offset = getMousePosition(evt)
    offset.x -= parseFloat(image.getAttributeNS(null, 'x'))
    offset.y -= parseFloat(image.getAttributeNS(null, 'y'))
  }

  const drag = (evt, image) => {
    if (selectedElement) {
      var coord = getMousePosition(evt)
      image.setAttributeNS(null, 'x', coord.x - offset.x)
      image.setAttributeNS(null, 'y', coord.y - offset.y)
    }

    // Update preview
    updatePreview()
  }

  const endDrag = (evt, image) => {
    selectedElement = ''
    console.log(`endDrag`)

    // Update preview
    updatePreview()
  }

  const fetchData = async (dataURL) => {
    let requestOptions = {
      method: 'GET',
      redirect: 'follow',
    }
    const response = await fetch(`${dataURL}`, requestOptions)
    if (!response.ok) throw new Response('Failed to get data', { status: 500 })
    return response.json()
  }

  const getDataForTokenId = async (tokenId) => {
    const web3 = new Web3(getDefaultChain() === `LUKSO` ? window.lukso : window.ethereum)
    const contract = new web3.eth.Contract(contracts[0].abi, contracts[0].contract_address)
    return await contract.methods.getDataForTokenId(`${tokenId}`, '0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e').call()
  }

  const getTokenIds = async (addr) => {
    const web3 = new Web3(getDefaultChain() === `LUKSO` ? window.lukso : window.ethereum)
    const contract = new web3.eth.Contract(contracts[0].abi, contracts[0].contract_address)
    return await contract.methods.tokenIdsOf(addr).call()
  }

  useEffect(() => {
    // getMintPrice().then((res) => console.log(res))
    // Restore prev draw
    // const innerSVG = document.querySelector(`.${styles['board']} svg`).innerHTML
    // if (localStorage.getItem(`draw`)) {
    //   setArtboard({x:})
    // }

    getTokenIds(auth.wallet).then(async (res) => {
      let dataKeys = []
      res.every(() => dataKeys.push(`0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e`))
      const web3 = new Web3()

      res.map((item, i) => {
        getDataForTokenId(item).then((data) => {
          data = web3.utils.hexToUtf8(data)
          data = data.slice(data.search(`data:application/json;`), data.length)

          // Read the data url
          fetchData(data).then((dataContent) => {
            dataContent.tokenId = res[i]
            setStage1Token((token) => token.concat(dataContent))
          })
        })
      })
    })
  }, [])

  return (
    <section className={`${styles.section} ms-motion-slideDownIn d-f-c flex-column`}>
      <div className={`__container`} data-width={`xlarge`}>
        <div className={`alert alert--info`} style={{ borderRadius: `999px` }}>
          <b>Important</b>: Before leaving, please make sure to download your pixel art. If you don't, your work will be lost.
        </div>

        <ul className={`${styles['tools']} d-flex align-items-center justify-content-center mt-20 ms-depth-4 w-100`}>
          <li className={`d-flex align-items-center`} style={{ columnGap: `.5rem` }}>
            <div className={`d-f-c`} style={{ columnGap: `.2rem` }}>
              <input type={`text`} id={`x`} defaultValue={32} />
            </div>
            <Icon name={`close`} />
            <div className={`d-f-c`} style={{ columnGap: `.2rem` }}>
              <input type={`text`} id={`y`} defaultValue={32} />
            </div>

            <div>
              <button className={`${styles['button-add']}`} onClick={() => add()} data-tooltip-id={`tooltip-add`}>
                <ReactTooltip id="tooltip-add" place="top" content="Create artboard" />
                <Icon name={`add`} />
              </button>
            </div>
          </li>

          <li className={`${styles['action']} d-flex align-items-center`} style={{ columnGap: `.2rem` }}>
            <button onClick={() => copy()} data-tooltip-id={`tooltip-copy`}>
              <ReactTooltip id="tooltip-copy" place="top" content="Copy" />
              <Icon name={`content_copy`} />
            </button>

            <button onClick={() => download()} data-tooltip-id={`tooltip-download`}>
              <ReactTooltip id="tooltip-download" place="top" content="Download" />
              <Icon name={`download_for_offline`} />
            </button>

            <button onClick={() => clear()} data-tooltip-id={`tooltip-clear`}>
              <ReactTooltip id="tooltip-clear" place="top" content="Clear" />
              <Icon name={`mop`} />
            </button>

            <ReactTooltip id="tooltip-color" place="top" content="Choose color" />
            <input type={`color`} list={`defaultColors`} data-tooltip-id={`tooltip-color`} defaultValue={localStorage.getItem(`color`)} onChange={(e) => localStorage.setItem(`color`, e.target.value)} />
            <datalist id={`defaultColors`}>
              <option>#007bff</option>
              <option>#6610f2</option>
              <option>#6f42c1</option>
              <option>#e83e8c</option>
              <option>#dc3545</option>
              <option>#fd7e14</option>
              <option>#ffc107</option>
              <option>#28a745</option>
              <option>#20c997</option>
              <option>#17a2b8</option>
              <option>#ffffff</option>
              <option>#6c757d</option>
              <option>#343a40</option>
              <option>#007bff</option>
              <option>#6c757d</option>
              <option>#28a745</option>
              <option>#17a2b8</option>
              <option>#ffc107</option>
              <option>#dc3545</option>
              <option>#f8f9fa</option>
              <option>#343a40</option>
            </datalist>
          </li>
        </ul>

        <div className={`grid grid--fit mt-20`} style={{ '--data-width': '150px', gap: `1rem` }}>
          <div className={``}>
            <h3 className={``}>Layers</h3>
            <div className={`${styles['layer']} card grid grid--fill`} style={{ '--data-width': '200px', gap: `1rem` }}>
              {layer &&
                layer.layers.map((item, i) => {
                  return (
                    <ul key={i} className={`${styles['layer__item']} d-flex flex-column align-items-start justify-content-between`} style={{ gap: `.1rem` }}>
                      <li className={`d-flex flex-row align-items-center justify-content-between`}>
                        <b>{item}</b>
                      </li>
                      <li className={`w-100`}>
                        <ul className={`d-flex flex-row align-items-start justify-content-between w-100`} style={{ gap: `.3rem` }}>
                          {item !== `artboardLayer` && (
                            <>
                              <li className={`d-flex flex-column align-items-start justify-content-between`}>
                                <span>Width</span>
                                <input type="number" step={1} defaultValue={400} onChange={(e) => changeDimension(e, `width`, item)} />
                              </li>
                              <li className={`d-flex flex-column align-items-start justify-content-between`}>
                                <span>Height</span>
                                <input type="number" step={1} defaultValue={400} onChange={(e) => changeDimension(e, `height`, item)} />
                              </li>
                            </>
                          )}
                          <li className={`d-flex flex-column align-items-start justify-content-between`}>
                            <span>Scale</span>
                            <input type="number" step={0.1} defaultValue={1} onChange={(e) => changeScale(e, item)} />
                          </li>
                          <button onClick={() => deleteLayer(item)}>
                            <Icon name={`delete`} style={{ color: `var(--red-200)` }} />
                          </button>
                        </ul>
                      </li>
                    </ul>
                  )
                })}
              {layer && layer.layers.length < 1 && (
                <div className={`d-f-c`} style={{ opacity: `.5`, gap: `.4rem`, width: `100%` }}>
                  <Icon name={`stacks`} />
                  <span>There is no layer</span>
                </div>
              )}
            </div>
          </div>

          <div className={``}>
            <h3 className={``}>Your {import.meta.env.VITE_NAME}</h3>
            <div className={`${styles['token']} card`}>
              {stage1Token && stage1Token.length > 0 && (
                <div className={`grid grid--fit`} style={{ '--data-width': '200px', gap: `.5rem`, alignItems: `flex-start` }}>
                  {/* If is LUKSO, show users profile as a layer */}
                  {auth.profile && (
                    <>
                      <div className={`animate__animated animate__fadeInUp`} style={{ animationDelay: `${0.1 / 10}s`, '--animate-duration': `400ms` }}>
                        <div className={`${styles['token__item']} d-flex flex-row align-items-center justify-content-between noSelect`}>
                          <figure title={auth.profile.LSP3Profile.name} className={`d-flex align-items-center`} style={{ gap: `.5rem` }}>
                            <img src={`${import.meta.env.VITE_IPFS_GATEWAY}${auth.profile.LSP3Profile.profileImage[0].url.replace('ipfs://', '').replace('://', '')}`} />
                            <figcaption style={{textWrap:`nowrap`}}>{auth.profile.LSP3Profile.name}</figcaption>
                          </figure>
                          <button onClick={() => addLayer(`${import.meta.env.VITE_IPFS_GATEWAY}${auth.profile.LSP3Profile.profileImage[0].url.replace('ipfs://', '').replace('://', '')}`, auth.profile.LSP3Profile.name)}>Add</button>
                        </div>
                      </div>
                    </>
                  )}
                  {stage1Token.map((item, i) => {
                    return (
                      <div key={i} className={`animate__animated animate__fadeInUp`} style={{ animationDelay: `${i / 10}s`, '--animate-duration': `400ms` }}>
                        <div className={`${styles['token__item']} d-flex flex-row align-items-center justify-content-between noSelect item${i}`}>
                          {item.LSP4Metadata.images.length > 0 && (
                            <figure title={item.LSP4Metadata.name} className={`d-flex align-items-center`} style={{ gap: `.5rem` }}>
                              <img src={`${import.meta.env.VITE_IPFS_GATEWAY}${item.LSP4Metadata.images[0][0].url.replace('ipfs://', '').replace('://', '')}`} />
                              <figcaption style={{textWrap:`nowrap`}}>{item.LSP4Metadata.name}</figcaption>
                            </figure>
                          )}
                          <button onClick={() => addLayer(`${import.meta.env.VITE_IPFS_GATEWAY}${item.LSP4Metadata.images[0][0].url.replace('ipfs://', '').replace('://', '')}`, item.LSP4Metadata.name)}>Add</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className={``}>Preview</h3>
            <div className={`${styles['preview']} card`}>
              <svg id={`previewSVG`} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" ref={SVGpreview}>
                <image style={{ transform: `translate(120px, 150px)` }} width="140" height="100" href={Cat} />
              </svg>
            </div>
          </div>
        </div>

        <div className={`w-100 mt-20`}>
          <div className={`${styles['board']} d-f-c`} onContextMenu={(e) => e.preventDefault()} onMouseLeave={() => (isMouseDown = false)} onMouseEnter={() => (isMouseDown = false)}>
            <svg id={`artboardSVG`} ref={SVG} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" onMouseDown={() => (isMouseDown = !isMouseDown)} onMouseUp={() => (isMouseDown = !isMouseDown)} />
          </div>

          <div className={`d-flex align-items-start jutify-content-start w-100 mt-10`}>
            Draw or choose a file &nbsp; <input type={`file`} onChange={(e) => setSelectedFile(e.target.files[0])} />
          </div>
        </div>

        <div className={`__container`} data-width={`small`}>
          <div className={`${styles['form']} card mt-20 mb-100`}>
            <div className={`card__header`}>Mint</div>
            <div className={`card__body`}>
              <div>
                <label htmlFor="">Total supply</label>
                <select name="count" id={`count`} defaultValue={count} onChange={(e) => setCount(e.target.value)}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                  <option value={7}>7</option>
                  <option value={8}>8</option>
                  <option value={9}>9</option>
                  <option value={10}>10</option>
                </select>
              </div>

              <div className="mt-10">
                <input type={`text`} id={`name`} placeholder={`Name`} defaultValue={assetname} onChange={(e) => setAssetname(e.target.value)} />
              </div>

              <div className="mt-10">
                <input type={`text`} id={`description`} placeholder={`Description`} defaultValue={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="mt-10">
                <button className={`${styles['mint']}`} onClick={() => mint()}>
                  Mint
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Home
