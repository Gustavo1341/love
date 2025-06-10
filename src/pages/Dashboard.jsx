import React, { useState, useEffect } from "react";
import { CoupleConfig } from "../entities/CoupleConfig";
import { UploadFile } from "../integrations/Core";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Heart, Upload, Music, Image, Trash2, Save, FileAudio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    couple_name: '',
    relationship_start: '',
    background_music_url: '',
    photos: [],
    custom_phrase: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUsingMock, setIsUsingMock] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      console.log("Iniciando carregamento da configuração...");
      // Definir um timeout para a operação de carregamento
      const loadConfigWithTimeout = async () => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout ao carregar configuração')), 10000);
        });
        
        return Promise.race([
          CoupleConfig.list(),
          timeoutPromise
        ]);
      };
      
      const configs = await loadConfigWithTimeout();
      
      if (configs.length > 0) {
        // Ensure all fields are initialized to prevent undefined errors
        const loadedConfig = configs[0];
        setConfig({
          couple_name: loadedConfig.couple_name || '',
          relationship_start: loadedConfig.relationship_start || '',
          background_music_url: loadedConfig.background_music_url || '',
          photos: loadedConfig.photos || [],
          custom_phrase: loadedConfig.custom_phrase || '',
          id: loadedConfig.id // keep id for updates
        });
        console.log("Configuração carregada com sucesso");
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      // Mesmo com erro, continuamos a operação para permitir criação de novo registro
    } finally {
      // Mesmo com erro no carregamento, permitimos que o usuário interaja com o formulário
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Remove id before saving to avoid schema validation errors
      const { id, ...saveData } = config;
      if (id) {
        await CoupleConfig.update(id, saveData);
      } else {
        const newConfig = await CoupleConfig.create(saveData);
        setConfig(prev => ({ ...prev, id: newConfig.id }));
      }
      
      // Redirect to story page after saving
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
    setIsSaving(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      console.log(`Iniciando upload de foto: ${file.name}`);
      const { file_url, isMock } = await UploadFile({ file });
      console.log(`Upload concluído: ${file_url}`);
      
      if (isMock) {
        setIsUsingMock(true);
      }
      
      const newPhoto = {
        url: file_url,
        caption: ''
      };
      setConfig(prev => ({
        ...prev,
        photos: [...prev.photos, newPhoto]
      }));
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert(`Falha ao fazer upload: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMusicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      console.log(`Iniciando upload de música: ${file.name}`);
      const { file_url, isMock } = await UploadFile({ file });
      console.log(`Upload concluído: ${file_url}`);
      
      if (isMock) {
        setIsUsingMock(true);
      }
      
      setConfig(prev => ({
        ...prev,
        background_music_url: file_url
      }));
    } catch (error) {
      console.error("Erro ao fazer upload da música:", error);
      alert(`Falha ao fazer upload da música: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index) => {
    setConfig(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const updatePhotoCaption = (index, caption) => {
    setConfig(prev => ({
      ...prev,
      photos: prev.photos.map((photo, i) => 
        i === index ? { ...photo, caption } : photo
      )
    }));
  };

  /*
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="pulse-animation">
          <div className="w-16 h-16 bg-[#FF6B6B] rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">♥</span>
          </div>
        </div>
      </div>
    );
  }
  */

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className={`max-w-4xl mx-auto space-y-8 transition-opacity ${isLoading ? 'opacity-70' : 'opacity-100'}`}>
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 text-[#FF6B6B]" fill="currentColor" />
            <h1 className="text-4xl font-bold text-white">Dashboard do Casal</h1>
            <Heart className="w-8 h-8 text-[#FF6B6B]" fill="currentColor" />
          </div>
          <p className="text-white/70 text-lg">Configure sua história de amor</p>
          {isLoading && (
            <div className="mt-2 text-[#FF6B6B] animate-pulse">
              Carregando dados... (você pode começar a editar)
            </div>
          )}
          {isUsingMock && (
            <div className="mt-2 bg-yellow-600/20 text-yellow-400 p-3 rounded-md text-sm">
              <strong>⚠️ Aviso:</strong> O sistema de armazenamento (Supabase Storage) precisa ser configurado.
              Os uploads estão usando URLs temporárias que não persistirão.
              <a href="https://supabase.com/docs/guides/storage/quickstart" className="underline ml-1" target="_blank" rel="noopener noreferrer">
                Como configurar
              </a>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#FF6B6B]" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Nome do Casal</Label>
              <Input
                value={config.couple_name}
                onChange={(e) => setConfig(prev => ({ ...prev, couple_name: e.target.value }))}
                placeholder="Ex: João & Maria"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label className="text-white">Data e Hora do Início do Relacionamento</Label>
              <Input
                type="datetime-local"
                value={config.relationship_start}
                onChange={(e) => setConfig(prev => ({ ...prev, relationship_start: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Frase Especial</Label>
              <Textarea
                value={config.custom_phrase}
                onChange={(e) => setConfig(prev => ({ ...prev, custom_phrase: e.target.value }))}
                placeholder="Ex: Onde tudo começou..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-[#FF6B6B]" />
              Fotos do Casal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="photo-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-[#FF6B6B]/50 rounded-lg p-6 text-center hover:border-[#FF6B6B] transition-colors">
                  <Upload className="w-8 h-8 text-[#FF6B6B] mx-auto mb-2" />
                  <p className="text-white">Clique para adicionar fotos</p>
                  <p className="text-white/50 text-sm">PNG, JPG até 10MB</p>
                </div>
              </Label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploading}
              />
            </div>

            {config.photos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.photos.map((photo, index) => (
                  <div key={index} className="space-y-2">
                    <div className="relative">
                      <img 
                        src={photo.url} 
                        alt={`Foto ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => removePhoto(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Legenda da foto (opcional)"
                      value={photo.caption}
                      onChange={(e) => updatePhotoCaption(index, e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Music */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-[#FF6B6B]" />
              Música de Fundo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="music-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-[#FF6B6B]/50 rounded-lg p-6 text-center hover:border-[#FF6B6B] transition-colors">
                  <Music className="w-8 h-8 text-[#FF6B6B] mx-auto mb-2" />
                  <p className="text-white">
                    {isUploading ? 'Enviando...' : (config.background_music_url ? 'Alterar música' : 'Clique para adicionar música')}
                  </p>
                  <p className="text-white/50 text-sm">MP3, WAV até 50MB</p>
                </div>
              </Label>
              <input
                id="music-upload"
                type="file"
                accept="audio/*"
                onChange={handleMusicUpload}
                className="hidden"
                disabled={isUploading}
              />
            </div>
            {config.background_music_url && (
              <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                <FileAudio className="w-5 h-5 text-[#FF6B6B]" />
                <p className="text-white/80 text-sm truncate flex-1">Música carregada</p>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="w-8 h-8"
                  onClick={() => setConfig(prev => ({...prev, background_music_url: ''}))}
                >
                  <Trash2 className="w-4 h-4 text-red-500"/>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white px-8 py-3 text-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
}
