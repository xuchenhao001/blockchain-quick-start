// Written by Xu Chen Hao
package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/core/chaincode/shim/ext/entities"
	sc "github.com/hyperledger/fabric/protos/peer"
	"strconv"
)

var encryptPrefix = "Encrypt@"

const DECKEY = "DECKEY"
const VERKEY = "VERKEY"
const ENCKEY = "ENCKEY"
const SIGKEY = "SIGKEY"
const IV = "IV"

type GoodsInfosEncrypt struct {
	UnitPrice        string `json:"unitPrice"`
	Amount           string `json:"amount"`
	Quantity         string `json:"quantity"`
	DelDate          string `json:"delDate"`
	QuantityCode     string `json:"quantityCode"`
	GoodsModel       string `json:"goodsModel"`
	GoodNo           string `json:"goodNo"`
	PriceCode        string `json:"priceCode"`
	GoodsName        string `json:"goodsName"`
	GoodsDescription string `json:"goodsDescription"`
}

type POEncrypt struct {
	Seller        string            `json:"seller"`
	Consignee     string            `json:"consignee"`
	Shipment      string            `json:"shipment"`
	Destination   string            `json:"destination"`
	InsureInfo    string            `json:"insureInfo"`
	TradeTerms    string            `json:"tradeTerms"`
	TotalCurrency string            `json:"totalCurrency"`
	Buyer         string            `json:"buyer"`
	TrafMode      string            `json:"trafMode"`
	GoodsInfos    GoodsInfosEncrypt `json:"goodsInfos"`
	TotalAmount   string            `json:"totalAmount"`
	Carrier       string            `json:"carrier"`
	PoNo          string            `json:"poNo"`
	Sender        string            `json:"sender"`
	PoDate        string            `json:"poDate"`
	TradeCountry  string            `json:"tradeCountry"`
}

func (s *SmartContract) validatePOEncrypt(po POEncrypt) (bool, error) {
	unitPrice, err := strconv.ParseFloat(po.GoodsInfos.UnitPrice, 64)
	if err != nil {
		return false, err
	}

	if unitPrice <= 0 {
		return false, nil
	}

	quantity, err := strconv.ParseFloat(po.GoodsInfos.Quantity, 64)
	if err != nil {
		return false, err
	}

	if quantity <= 0 {
		return false, nil
	}

	amount, err := strconv.ParseFloat(po.GoodsInfos.Amount, 64)
	if err != nil {
		return false, err
	}

	if amount <= 0 {
		return false, nil
	}

	if unitPrice*quantity != amount {
		return false, nil
	}
	return true, nil
}

func (s *SmartContract) uploadEncrypt(APIstub shim.ChaincodeStubInterface, args []string,
	encKey, signOrIV []byte) sc.Response {

	if len(args) != 2 {
		return s.returnError("Wrong number of parameters, need key & value")
	}

	logger.Debugf("Got request parameters: [key] %s, [value] %s", args[0], args[1])

	key := args[0]
	valueAsByte := []byte(args[1])

	err := s.writeChainEncryptAll(APIstub, key, valueAsByte, encKey, signOrIV)
	if err != nil {
		return s.returnError("Data encrypt and write to chain failed: " + err.Error())
	}

	return shim.Success(valueAsByte)

}

func (s *SmartContract) queryDecrypt(APIstub shim.ChaincodeStubInterface, args []string,
	decKey, signOrIV []byte) sc.Response {

	if len(args) != 1 {
		return s.returnError("Wrong number of parameters, need key & value")
	}

	logger.Debugf("Got request parameters: [key] %s", args[0])

	key := args[0]

	valueAsBytes, err := s.readChainDecryptAll(APIstub, key, decKey, signOrIV)
	if err != nil {
		return s.returnError("Data decrypt and query failed: " + err.Error())
	}

	return shim.Success(valueAsBytes)

}

func (s *SmartContract) uploadPOEncrypt(APIstub shim.ChaincodeStubInterface, args []string,
	encKey, signOrIV []byte, encPart, sign bool) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	logger.Debug("获取请求参数: " + args[0])

	poAsBytes := []byte(args[0])
	var po POEncrypt
	err := json.Unmarshal(poAsBytes, &po)
	if err != nil {
		return s.returnError("PO单格式错误: " + err.Error())
	}

	// 验证PO单是否合法
	validateResult, err := s.validatePOEncrypt(po)
	if err != nil {
		return s.returnError("PO单合法性验证失败: " + err.Error())
	}
	if !validateResult {
		return s.returnError("PO单不合法")
	}

	// 数据上链
	if sign {
		err = s.writeChainSignPOEncrypt(APIstub, po, encKey, signOrIV, encPart)
	} else {
		err = s.writeChainPOEncrypt(APIstub, po, encKey, signOrIV, encPart)
	}
	if err != nil {
		return s.returnError("PO单上链失败: " + err.Error())
	}

	return shim.Success(poAsBytes)

}

func (s *SmartContract) queryPODecrypt(APIstub shim.ChaincodeStubInterface, args []string,
	decKey, signOrIV []byte, decPart, verify bool) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	poNo := args[0]

	if verify {
		po, err := s.readChainVerifyPODecrypt(APIstub, poNo, decKey, signOrIV, decPart)
		if err != nil {
			return s.returnError("po单查询解密验证签名失败" + err.Error())
		}
		poAsBytes, err := json.Marshal(*po)
		if err != nil {
			return s.returnError(err.Error())
		}
		return shim.Success(poAsBytes)
	} else {
		po, err := s.readChainPODecrypt(APIstub, poNo, decKey, signOrIV, decPart)
		if err != nil {
			return s.returnError("po单查询解密失败" + err.Error())
		}
		poAsBytes, err := json.Marshal(*po)
		if err != nil {
			return s.returnError(err.Error())
		}
		return shim.Success(poAsBytes)
	}

}

// Do encrypt & write chain for common data
func (s *SmartContract) writeChainEncryptAll(APIstub shim.ChaincodeStubInterface,
	key string, valueAsBytes []byte, encKey, IV []byte) error {

	ent, err := entities.NewAES256EncrypterEntity("ID", s.bccspInst, encKey, IV)
	if err != nil {
		return errors.New("entities.NewAES256EncrypterEntity failed, err %s" + err.Error())
	}

	// Do fully encrypt
	logger.Debugf("Do fully encrypt: [data] %s", string(valueAsBytes))
	cipherText, err := s.encrypt(APIstub, ent, valueAsBytes)
	if err != nil {
		return err
	}

	logger.Debugf("Write chain: [key] %s [data] %s", key, string(cipherText))
	encryptKey := key
	err = APIstub.PutState(encryptKey, cipherText)
	if err != nil {
		return err
	}

	return nil
}

// Do read chain & decrypt for common data
func (s *SmartContract) readChainDecryptAll(APIstub shim.ChaincodeStubInterface,
	key string, decKey, IV []byte) ([]byte, error) {

	ent, err := entities.NewAES256EncrypterEntity("ID", s.bccspInst, decKey, IV)
	if err != nil {
		return nil, errors.New("entities.NewAES256EncrypterEntity failed, err %s" + err.Error())
	}

	// Do fully decrypt
	valueAsBytes, err := APIstub.GetState(key)
	if err != nil {
		return nil, err
	}

	logger.Debug("Do fully decrypt: " + string(valueAsBytes))
	clearText, err := s.decrypt(APIstub, ent, valueAsBytes)
	if err != nil {
		return nil, err
	}

	return clearText, nil
}

// Do encrypt & write chain
func (s *SmartContract) writeChainPOEncrypt(APIstub shim.ChaincodeStubInterface,
	po POEncrypt, encKey, IV []byte, encPart bool) error {

	ent, err := entities.NewAES256EncrypterEntity("ID", s.bccspInst, encKey, IV)
	if err != nil {
		return errors.New("entities.NewAES256EncrypterEntity failed, err %s" + err.Error())
	}

	if encPart == false {

		// Do fully encrypt
		poAsBytes, err := json.Marshal(po)
		if err != nil {
			return err
		}
		logger.Debug("Do fully encrypt: " + string(poAsBytes))
		cipherText, err := s.encrypt(APIstub, ent, poAsBytes)
		if err != nil {
			return err
		}

		logger.Debug("Write chain: " + string(cipherText))
		encryptKey := encryptPrefix + po.PoNo
		err = APIstub.PutState(encryptKey, cipherText)
		if err != nil {
			return err
		}
	} else {

		// Do partly encrypt
		logger.Debug("Do partly encrypt: " + po.GoodsInfos.UnitPrice)
		cipherText, err := s.encrypt(APIstub, ent, []byte(po.GoodsInfos.UnitPrice))
		if err != nil {
			return err
		}

		po.GoodsInfos.UnitPrice = base64.StdEncoding.EncodeToString(cipherText)

		poAsBytes, err := json.Marshal(po)
		if err != nil {
			return err
		}

		logger.Debug("Write chain: " + string(poAsBytes))
		encryptKey := encryptPrefix + po.PoNo
		err = APIstub.PutState(encryptKey, poAsBytes)
		if err != nil {
			return err
		}
	}

	return nil
}

// Do read chain & decrypt
func (s *SmartContract) readChainPODecrypt(APIstub shim.ChaincodeStubInterface,
	poNo string, decKey, IV []byte, encPart bool) (*POEncrypt, error) {

	ent, err := entities.NewAES256EncrypterEntity("ID", s.bccspInst, decKey, IV)
	if err != nil {
		return nil, errors.New("entities.NewAES256EncrypterEntity failed, err %s" + err.Error())
	}

	var po POEncrypt

	logger.Debug("Query on chain: " + poNo)
	if encPart == false {

		// Do fully decrypt
		encryptKey := encryptPrefix + poNo
		poAsBytes, err := APIstub.GetState(encryptKey)
		if err != nil {
			return nil, err
		}

		logger.Debug("Do fully decrypt: " + string(poAsBytes))
		clearText, err := s.decrypt(APIstub, ent, poAsBytes)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(clearText, &po)
		if err != nil {
			return nil, err
		}

		return &po, nil

	} else {

		// Do partly decrypt
		encryptKey := encryptPrefix + poNo
		poAsBytes, err := APIstub.GetState(encryptKey)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(poAsBytes, &po)
		if err != nil {
			return nil, err
		}

		logger.Debug("Do partly decrypt: " + po.GoodsInfos.UnitPrice)
		cipherText, err := base64.StdEncoding.DecodeString(po.GoodsInfos.UnitPrice)
		if err != nil {
			return nil, err
		}
		unitPriceBytes, err := s.decrypt(APIstub, ent, cipherText)
		if err != nil {
			return nil, err
		}

		po.GoodsInfos.UnitPrice = string(unitPriceBytes)
	}

	return &po, nil
}

// Do encrypt & write chain
func (s *SmartContract) writeChainSignPOEncrypt(APIstub shim.ChaincodeStubInterface,
	po POEncrypt, encKey, signKey []byte, encPart bool) error {

	ent, err := entities.NewAES256EncrypterECDSASignerEntity("ID", s.bccspInst, encKey, signKey)
	if err != nil {
		return errors.New("entities.NewAES256EncrypterEntity failed, err: " + err.Error())
	}

	if encPart == false {

		// Do fully encrypt
		poAsBytes, err := json.Marshal(po)
		if err != nil {
			return err
		}
		logger.Debug("Do fully sign & encrypt: " + string(poAsBytes))
		cipherText, err := s.signEncrypt(APIstub, ent, poAsBytes)
		if err != nil {
			return err
		}

		logger.Debug("Write chain: " + string(cipherText))
		encryptKey := encryptPrefix + po.PoNo
		err = APIstub.PutState(encryptKey, cipherText)
		if err != nil {
			return err
		}
	} else {

		// Do partly encrypt
		logger.Debug("Do partly sign & encrypt: " + po.GoodsInfos.UnitPrice)
		cipherText, err := s.signEncrypt(APIstub, ent, []byte(po.GoodsInfos.UnitPrice))
		if err != nil {
			return err
		}

		po.GoodsInfos.UnitPrice = base64.StdEncoding.EncodeToString(cipherText)

		poAsBytes, err := json.Marshal(po)
		if err != nil {
			return err
		}

		logger.Debug("Write chain: " + string(poAsBytes))
		encryptKey := encryptPrefix + po.PoNo
		err = APIstub.PutState(encryptKey, poAsBytes)
		if err != nil {
			return err
		}
	}

	return nil
}

// Do read chain & decrypt
func (s *SmartContract) readChainVerifyPODecrypt(APIstub shim.ChaincodeStubInterface,
	poNo string, decKey, verKey []byte, encPart bool) (*POEncrypt, error) {

	ent, err := entities.NewAES256EncrypterECDSASignerEntity("ID", s.bccspInst, decKey, verKey)
	if err != nil {
		return nil, errors.New("entities.NewAES256EncrypterEntity failed, err: " + err.Error())
	}

	var po POEncrypt

	logger.Debug("Query on chain: " + poNo)
	if encPart == false {

		// Do fully decrypt
		encryptKey := encryptPrefix + poNo
		poAsBytes, err := APIstub.GetState(encryptKey)
		if err != nil {
			return nil, err
		}

		logger.Debug("Do fully decrypt & verify: " + string(poAsBytes))
		clearText, err := s.decryptVerify(APIstub, ent, poAsBytes)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(clearText, &po)
		if err != nil {
			return nil, err
		}

		return &po, nil

	} else {

		// Do partly decrypt
		encryptKey := encryptPrefix + poNo
		poAsBytes, err := APIstub.GetState(encryptKey)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(poAsBytes, &po)
		if err != nil {
			return nil, err
		}

		logger.Debug("Do partly decrypt & verify: " + po.GoodsInfos.UnitPrice)
		cipherText, err := base64.StdEncoding.DecodeString(po.GoodsInfos.UnitPrice)
		if err != nil {
			return nil, err
		}
		unitPriceBytes, err := s.decryptVerify(APIstub, ent, cipherText)
		if err != nil {
			return nil, err
		}

		po.GoodsInfos.UnitPrice = string(unitPriceBytes)
	}

	return &po, nil
}

func (s *SmartContract) signEncrypt(stub shim.ChaincodeStubInterface,
	ent entities.EncrypterSignerEntity, value []byte) ([]byte, error) {

	logger.Debug("Sign and encrypt: " + string(value))
	msg := &entities.SignedMessage{Payload: value, ID: []byte(ent.ID())}
	err := msg.Sign(ent)
	if err != nil {
		return nil, err
	}

	// here we serialize the SignedMessage
	msgBytes, err := msg.ToBytes()
	if err != nil {
		return nil, err
	}

	logger.Debug("Sign and encrypt successfully: " + string(msgBytes))
	return s.encrypt(stub, ent, msgBytes)
}

func (s *SmartContract) decryptVerify(stub shim.ChaincodeStubInterface,
	ent entities.EncrypterSignerEntity, value []byte) ([]byte, error) {

	logger.Debug("Decrypt and verify: " + string(value))
	value, err := s.decrypt(stub, ent, value)
	if err != nil {
		return nil, err
	}

	msg := &entities.SignedMessage{}
	err = msg.FromBytes(value)
	if err != nil {
		return nil, err
	}

	// verify the signature
	ok, err := msg.Verify(ent)
	if err != nil {
		return nil, err
	} else if !ok {
		return nil, errors.New("invalid signature")
	}

	logger.Debug("Decrypt and verify successfully: " + string(msg.Payload))
	return msg.Payload, nil
}

func (s *SmartContract) encrypt(stub shim.ChaincodeStubInterface,
	ent entities.Encrypter, value []byte) ([]byte, error) {

	logger.Debug("Value to encrypt: " + string(value))
	cipherText, err := ent.Encrypt(value)
	if err != nil {
		return nil, errors.New("Encrypt failed: " + err.Error())
	}

	logger.Debug("After encrypt: " + string(cipherText))
	return cipherText, nil
}

func (s *SmartContract) decrypt(stub shim.ChaincodeStubInterface,
	ent entities.Encrypter, value []byte) ([]byte, error) {

	logger.Debug("Value to decrypt: " + string(value))
	clearText, err := ent.Decrypt(value)
	if err != nil {
		return nil, errors.New("Decrypt failed: " + err.Error())
	}

	logger.Debug("After decrypt: " + string(clearText))
	return clearText, nil
}
