/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { Link, useHistory } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { Map, TileLayer, Marker } from "react-leaflet";
import { LeafletMouseEvent } from "leaflet";
import { Toast } from "../../utils/swal";

import formatWhatsapp from "../../utils/mask";
import api from "../../services/api";
import logo from "../../assets/logo.svg";

import Dropzone from "../../components/Dropzone";

import "./styles.css";

// sempre que cria um estado para um array ou objeto precisa informar o tipo da variável que vai ser armazenada SEMPRE!

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityResponse {
  nome: string;
}

const CreatePoint: React.FC = () => {
  const history = useHistory();
  const [items, setItems] = useState<Item[]>([]);
  const [initialPosition, setInitialPosition] = useState<[number, number]>([
    0,
    0,
  ]);

  const [ufs, setUfs] = useState<string[]>([]);
  const [selectedUf, setSelectedUf] = useState("0");

  const [citys, setCitys] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("0");

  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    0,
    0,
  ]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [selectedItems, setSelectedItems] = useState<number[]>([0, 0]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [loading, setLoading] = useState(false);

  async function getItems() {
    const res = await api.get("/items");
    setItems(res.data);
  }

  useEffect(() => {
    getItems();
  }, []);

  async function getUfs() {
    const res = await axios.get<IBGEUFResponse[]>(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
    );

    const ufInitials = res.data.map((uf) => uf.sigla);

    setUfs(ufInitials);
    console.log(ufInitials);
  }

  useEffect(() => {
    getUfs();
  }, []);

  async function getCitys() {
    if (selectedUf === "0") {
      return;
    }

    const res = await axios.get<IBGECityResponse[]>(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`
    );

    const cityNames = res.data.map((city) => city.nome);
    setCitys(cityNames);
  }

  useEffect(() => {
    getCitys();
  }, [selectedUf]);

  function handleSelectUf(e: ChangeEvent<HTMLSelectElement>) {
    setSelectedUf(e.target.value);
  }
  function handleSelectCity(e: ChangeEvent<HTMLSelectElement>) {
    setSelectedCity(e.target.value);
  }
  function handleMapClick(e: LeafletMouseEvent) {
    setSelectedPosition([e.latlng.lat, e.latlng.lng]);
  }
  function getCurrentPosition() {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setInitialPosition([latitude, longitude]);
    });
  }

  useEffect(() => {
    getCurrentPosition();
  }, []);

  function handleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex((item) => item === id);

    if (alreadySelected >= 0) {
      const filteredItems = selectedItems.filter((item) => item !== id);
      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!selectedFile) {
      Toast.fire({
        icon: "error",
        title: "Você precisa carregar uma imagem",
      });

      setLoading(false);
      return;
    }

    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;

    // classe global do js no formato para aceitar arquivos etc
    const data = new FormData();

    data.append("name", name);
    data.append("email", email);
    data.append("whatsapp", whatsapp);
    data.append("uf", uf);
    data.append("city", city);
    data.append("latitude", String(latitude));
    data.append("longitude", String(longitude));
    data.append("items", items.join(","));

    if (selectedFile) {
      data.append("image", selectedFile);
    }

    try {
      await api.post("/points", data);
      setIsSuccess(true);

      setTimeout(() => {
        history.push("/");
      }, 2000);
    } catch (err) {
      Toast.fire({
        icon: "error",
        title:
          "Ops, algo deu errado! Verifique todos os campos e tente novamente",
      });
      console.log(err.message);
      setLoading(false);
    }
    setLoading(false);
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />
        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>
          Cadastro do <br /> ponto de coleta
        </h1>
        <Dropzone onFileUploaded={setSelectedFile} />
        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                inputMode="email"
                type="email"
                name="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input
                inputMode="numeric"
                type="text"
                name="whatsapp"
                maxLength={15}
                minLength={15}
                id="whatsapp"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione um endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select
                name="uf"
                id="uf"
                value={selectedUf}
                onChange={handleSelectUf}
                required
              >
                <option disabled value="0">
                  Selecione uma UF
                </option>
                {ufs.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                value={selectedCity}
                id="city"
                onChange={handleSelectCity}
                required
              >
                <option disabled value="0">
                  Selecione uma cidade
                </option>
                {citys.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítens de coleta</h2>
            <span>Selecione um ou mais ítens abaixo</span>
          </legend>
          <ul className="items-grid">
            {items.map((item) => (
              <li
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                className={selectedItems.includes(item.id) ? "selected" : ""}
              >
                <img src={item.image_url} alt="Óleo" />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>
        <button type="submit" disabled={loading}>
          {loading ? "Aguarde..." : "Cadastrar ponto de coleta"}
        </button>
      </form>
      <div id="modal-success" className={isSuccess ? "success" : ""}>
        <FiCheckCircle size={26} color="#34cb79" />
        <h2>Cadastro concluído!</h2>
      </div>
    </div>
  );
};

export default CreatePoint;
