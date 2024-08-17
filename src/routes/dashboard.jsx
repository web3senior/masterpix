import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth,contracts } from './../contexts/AuthContext'
import { Title } from './helper/DocumentTitle'
import Icon from './helper/MaterialIcon'
import styles from './Dashboard.module.scss'

export default function About({ title }) {
  Title(title)
  const [taotlRecordType, setTotalRecordType] = useState(0)
  const [totalResolve, setTotalResolve] = useState(0)
  useEffect(() => {

  }, [])
  const getTotalRecordType = async () => await contract.methods._recordTypeCounter().call()
  const getTotalResolve = async () => await contract.methods._resolveCounter().call()
  const getResolveList = async (wallet) => await contract.methods.getDomainList(wallet).call()
  const getTotalSupply = async () => await contract.methods.totalSupply().call()
  const getCouncilMintExpiration = async () => await contract.methods.councilMintExpiration().call()
  const getMaxSupply = async () => await contract.methods.MAX_SUPPLY().call()
  const auth = useAuth()
  useEffect(() => {
    getTotalRecordType().then((res) => {
      setTotalRecordType(_.toNumber(res))
      setIsLoading(false)
    })

    getTotalResolve().then((res) => {
      setTotalResolve(_.toNumber(res))
      setIsLoading(false)
    })
    getResolveList(auth.wallet).then((res) => {
      console.log(res)
      setIsLoading(false)
    })
  }, [])

  return (
    <section className={styles.section}>
      <div className={`${styles['container']} __container ms-motion-slideUpIn`} data-width={`xxlarge`}>
        <div className="grid grid--fit" style={{ '--data-width': `200px`, columnGap: `1rem` }}>
          <div className={`card`}>
            <div className={`card__body d-flex align-items-center justify-content-between`}>
              <div>
                <span>Total gift card</span>
                <h1>400</h1>
              </div>
              <div className={`${styles['card-icon']}`}>
                <Icon name={`loyalty`} />
              </div>
            </div>
          </div>
          <div className={`card`}>
            <div className={`card__body d-flex align-items-center justify-content-between`}>
              <div>
                <span>Total claimed</span>
                <h1>1</h1>
              </div>
              <div className={`${styles['card-icon']}`}>
                <Icon name={`storefront`} />
              </div>
            </div>
          </div>
        </div>

        <div className={`grid grid--fit mt-50`} style={{ '--data-width': '300px', gap: '1rem' }}>
          <div className={`card`}>
            <div className={`card__body`}>
              <p>Total extensions</p>
              <h2>{taotlRecordType}</h2>
            </div>
          </div>
          <div className={`card`}>
            <div className={`card__body`}>
              <p>Total names</p>
              <h2>{totalResolve}</h2>
            </div>
          </div>
          <div className={`card`}>
            <div className={`card__body`}>
              <p>Total owners</p>
              <h2>1</h2>
            </div>
          </div>
          <div className={`card`}>
            <div className={`card__body`}>
              <p>Total integrations</p>
              <h2>1</h2>
            </div>
          </div>
        </div>

        <h3 className={`mt-40`}>Claimed Transactions</h3>
        <div className={`card`}>
          <div className={`card__body`}>
            <span>alo</span>
            <span>200</span>
            <span>Buy</span>
            <span>140$</span>
            <span>Amir</span>
            <span>07/07/2024</span>
          </div>
        </div>
        <div className={`card`}>
          <span>alo</span>
          <span>200</span>
          <span>140$</span>
          <span>Amir</span>
          <span>07/07/2024</span>
        </div>
        <div className={`card`}>
          <span>alo</span>
          <span>200</span>
          <span>140$</span>
          <span>Amir</span>
          <span>07/07/2024</span>
        </div>

        <Link to={`d`}>View all</Link>
      </div>
    </section>
  )
}
