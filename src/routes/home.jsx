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
import Hero from './../../src/assets/hero.png'
import party from 'party-js'
import styles from './Home.module.scss'
import { PinataSDK } from 'pinata'
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
  const auth = useAuth()
  const navigate = useNavigate()
  const txtSearchRef = useRef()
  const recordTypeRef = useRef()
  const [selectedFile, setSelectedFile] = useState()

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
    document.querySelectorAll(`#artboardSVG rect`).forEach((item) => {
      let modified = item.getAttribute(`modified`)
      if (modified === false) {
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

  const add = () => {
    setShowArtboard(true)
    rect()
    toast.success(`Artboard has been created`, { icon: `💡` })
    localStorage.removeItem(`draw`)
  }

  const draw = (e) => {
    let color = document.querySelector(`input[type='color']`).value
    if (e.button === 2) {
      color = e.target.getAttribute(`default-color`)
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
    const innerSVG = document.querySelector(`.${styles['board']} svg`).innerHTML
    localStorage.setItem(`draw`, innerSVG)
  }

  const clear = () => {
    document.querySelectorAll(`.${styles['board']} rect`).forEach((item) => {
      item.style.fill = item.getAttribute(`default-color`)
      item.setAttribute(`modified`, false)
    })
    toast.success(`Artboard has been cleared`, { icon: `🧹` })
  }

  const rect = () => {
    document.querySelector(`#artboardSVG`).innerHTML = ''
    const countX = document.querySelector(`#x`).value
    const countY = document.querySelector(`#y`).value
    let width = 400 / countX
    let height = 400 / countY
    let colors = [`#FFF`, `#D9D9D9`]
    let colorIndex = false
    console.log(`Width: ${width} | Height: ${height}`)

    for (let y = 0; y < countY; y++) {
      for (let x = 0; x < countX; x++) {
        var svgns = 'http://www.w3.org/2000/svg'
        var rect = document.createElementNS(svgns, 'rect')
        rect.setAttribute('x', x * width)
        rect.setAttribute('y', y * height)
        rect.setAttribute('height', height)
        rect.setAttribute('width', width)
        rect.setAttribute('fill', colorIndex ? colors[0] : colors[1])
        rect.setAttribute('default-color', colorIndex ? colors[0] : colors[1])
        rect.onmouseenter = (e) => draw(e)
        rect.onmousedown = (e) => draw(e)

        document.querySelector(`#artboardSVG`).appendChild(rect)
        // stroke={`red`} strokeOpacity={0.1} strokeWidth={1} key={`x${x}y${y}`}
        colorIndex = !colorIndex
      }
      colorIndex = !colorIndex
    }
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
    if (!showArtboard && selectedFile === undefined) {
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
                { title: 'Website', url: 'https://masterpix.vercel.app/' },
                { title: 'Mint', url: 'https://masterpix.vercel.app/' },
                { title: '𝕏', url: 'https://x.com/ArattaLabsDev' },
                { title: 'Telegram', url: 'https://t.me/arattalabs' },
              ],
              attributes: [
                { key: 'Version', value: 1 },
              ],
              icon: [{ width: 512, height: 512, url: 'ipfs://QmWpSVntG9Mmk9CHczf9ZACKDTuQMVUedEDcCdwwbqBs9b', verification: { method: 'keccak256(bytes)', data: '0xe303725c7fa6e0c8741376085a3859d858eb4d188afa6402bb39d34f40e5ed3f' } }],
              backgroundImage: [],
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

  useEffect(() => {
    //getMintPrice().then((res) => console.log(res))
    // Restore prev draw
    // const innerSVG = document.querySelector(`.${styles['board']} svg`).innerHTML
    // if (localStorage.getItem(`draw`)) {
    //   setArtboard({x:})
    // }
  }, [])

  return (
    <>
      <section className={`${styles.section} ms-motion-slideDownIn d-f-c flex-column`}>
        <div className={`${styles['hero']} w-100 d-f-c flex-column`}>
          <figure className={`d-f-c`}>
            <img alt={import.meta.env.VITE_TITLE} src={Hero} />
          </figure>
          <h1>{import.meta.env.VITE_TITLE}</h1>
          <p>{import.meta.env.VITE_SLOGAN}</p>
        </div>

        <div className={`__container d-f-c flex-column`} data-width={`medium`}>
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
                <button className={`${styles['button-add']}`} onClick={() => add()}>
                  <Icon name={`add`} />
                </button>
              </div>
            </li>
            <li className={`${styles['action']} d-flex align-items-center`} style={{ columnGap: `.2rem` }}>
              <button onClick={() => copy()}>
                <Icon name={`content_copy`} />
              </button>
              <button onClick={() => download()}>
                <Icon name={`download_for_offline`} />
              </button>
              <button onClick={() => clear()}>
                <Icon name={`mop`} />
              </button>

              <input type={`color`} list={`defaultColors`} defaultValue={localStorage.getItem(`color`)} onChange={(e) => localStorage.setItem(`color`, e.target.value)} />
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
        </div>

        <div className={`__container d-f-c flex-column`} data-width={`medium`}>
          <div className={`${styles['board']} d-f-c mt-20`} onContextMenu={(e) => e.preventDefault()} onMouseLeave={() => (isMouseDown = false)} onMouseEnter={() => (isMouseDown = false)}>
            <svg id={`artboardSVG`} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" onMouseDown={() => (isMouseDown = !isMouseDown)} onMouseUp={() => (isMouseDown = !isMouseDown)}></svg>
          </div>

          <div className={`d-flex align-items-start jutify-content-start w-100 mt-10`}>
            Draw or choose file &nbsp; <input type={`file`} onChange={(e) => setSelectedFile(e.target.files[0])} />
          </div>

          <div className="card form mt-10 w-100">
            <div className={`card__body`}>
              <div>
                <input type={`number`} id={`count`} placeholder={`Count`} defaultValue={count} onChange={(e) => setCount(e.target.value)} />
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
      </section>
    </>
  )
}

export default Home
