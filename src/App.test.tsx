function AppTest() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Teste React Funcionando</h1>
      <p>Se você pode ver esta mensagem, o React está carregando corretamente.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <p>O problema pode estar em:</p>
        <ul>
          <li>Importação de módulos</li>
          <li>Configuração do Tailwind CSS</li>
          <li>Contexto/Store do React</li>
          <li>Erros no console do navegador</li>
        </ul>
      </div>
    </div>
  )
}

export default AppTest