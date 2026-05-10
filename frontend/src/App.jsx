import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Wallet, Layout, ShoppingCart, Image as ImageIcon, PlusCircle } from 'lucide-react'
import { 
  ART_NFT_ADDRESS, ART_NFT_ABI, 
  ART_TOKEN_ADDRESS, ART_TOKEN_ABI,
  ART_MARKETPLACE_ADDRESS, ART_MARKETPLACE_ABI 
} from './constants'

function App() {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [balance, setBalance] = useState("0")

  useEffect(() => {
    if (account) {
      console.log("Hesap durumu güncellendi:", account);
    }
  }, [account]);

 
  const connectWallet = async () => {
    console.log("Bağlan butonu tetiklendi...");
    
    if (window.ethereum) {
      try {
        
        const accounts = await window.ethereum.request({ 
          method: "eth_requestAccounts" 
        });
        
        const tempProvider = new ethers.BrowserProvider(window.ethereum);
        
        setAccount(accounts[0]);
        setProvider(tempProvider);
        
        alert("Başarıyla bağlandık! Adres: " + accounts[0]);

      
        try {
          const tokenContract = new ethers.Contract(ART_TOKEN_ADDRESS, ART_TOKEN_ABI, tempProvider);
          const userBalance = await tokenContract.balanceOf(accounts[0]);
          setBalance(ethers.formatEther(userBalance));
        } catch (bakiyeHata) {
          console.error("Bakiye çekilirken hata (Muhtemelen yanlış ağ):", bakiyeHata);
        }

      } catch (error) {
        console.error("Bağlantı hatası:", error);
        if (error.code === 4001) {
          alert("Bağlantı isteğini reddettiniz.");
        }
      }
    } else {
      alert("MetaMask yüklü değil! Lütfen eklentiyi kurun.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <nav className="border-b border-slate-800 p-4 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ImageIcon className="text-indigo-500" size={32} />
          <h1 className="text-2xl font-bold tracking-tighter italic">ArtDigital</h1>
        </div>
        
        <button 
          onClick={connectWallet}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-full font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          <Wallet size={20} />
          {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Cüzdanı Bağla"}
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        {!account ? (
          <div className="text-center py-20">
            <h2 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Geleceğin Sanatına Hoş Geldin
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Kendi dijital eserlerini üret, sergile ve güvenle ticaretini yap. 
              Sepolia ağında gerçek bir NFT deneyimi seni bekliyor.
            </p>
            <div className="flex justify-center gap-4">
               <div className="animate-bounce p-2 bg-slate-800 rounded-full">👇 Cüzdanını bağlayarak başla</div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl border-t-indigo-500 border-t-2">
                <p className="text-slate-400 text-sm mb-1 font-medium">Mevcut Bakiyen</p>
                <h3 className="text-3xl font-bold text-white">
                  {parseFloat(balance).toLocaleString()} <span className="text-indigo-400 text-xl font-normal underline">ART</span>
                </h3>
              </div>
            </div>

            <div className="p-10 border-2 border-dashed border-slate-800 rounded-3xl text-center text-slate-500">
               Buraya NFT Mintleme ve Galeri alanı gelecek...
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App